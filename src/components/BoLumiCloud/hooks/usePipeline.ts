import { useState, useRef, useEffect, useCallback } from 'react'
import type { AnalysisResponse } from '@/lib/types/glare'
import type { PipelineConfig, PipelineProgress, PipelineUploadResponse } from '@/lib/types/pipeline'
import { logger } from '@/lib/logger'

interface UsePipelineOptions {
  apiUrl: string
}

export type PipelinePhase = 'idle' | 'uploading' | 'running' | 'polling' | 'completed' | 'error'

interface UsePipelineReturn {
  phase: PipelinePhase
  sessionId: string | null
  vfCount: number
  progress: PipelineProgress | null
  results: AnalysisResponse | null
  error: string | null

  uploadFiles: (vfFiles: File[], objFile: File, mtlFile: File | null) => Promise<void>
  runPipeline: (config: PipelineConfig) => Promise<void>
  reset: () => void
}

export function usePipeline({ apiUrl }: UsePipelineOptions): UsePipelineReturn {
  const [phase, setPhase] = useState<PipelinePhase>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [vfCount, setVfCount] = useState(0)
  const [progress, setProgress] = useState<PipelineProgress | null>(null)
  const [results, setResults] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const errorCountRef = useRef(0)

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [])

  const reset = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    setPhase('idle')
    setSessionId(null)
    setVfCount(0)
    setProgress(null)
    setResults(null)
    setError(null)
    errorCountRef.current = 0
  }, [])

  const uploadFiles = useCallback(async (vfFiles: File[], objFile: File, mtlFile: File | null) => {
    setPhase('uploading')
    setError(null)

    try {
      const formData = new FormData()
      for (const vf of vfFiles) {
        formData.append('vf_files', vf)
      }
      formData.append('obj_file', objFile)
      if (mtlFile) {
        formData.append('mtl_file', mtlFile)
      }

      const res = await fetch(`${apiUrl}/pipeline/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: '업로드 실패' }))
        throw new Error(errData.detail || '파일 업로드 실패')
      }

      const data: PipelineUploadResponse = await res.json()
      setSessionId(data.session_id)
      setVfCount(data.vf_count)
      setPhase('idle')
      logger.info('Pipeline upload success', { sessionId: data.session_id, vfCount: data.vf_count })
    } catch (err) {
      const msg = err instanceof Error ? err.message : '업로드 중 오류 발생'
      setError(msg)
      setPhase('error')
      logger.error('Pipeline upload error', err instanceof Error ? err : undefined)
    }
  }, [apiUrl])

  const startPolling = useCallback((sid: string) => {
    errorCountRef.current = 0

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${apiUrl}/pipeline/progress/${sid}`)
        const data: PipelineProgress = await res.json()

        errorCountRef.current = 0
        setProgress(data)

        if (data.status === 'completed') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }

          const resultsRes = await fetch(`${apiUrl}/pipeline/results/${sid}`)
          if (resultsRes.ok) {
            const resultsData = await resultsRes.json()
            setResults(resultsData)
            setPhase('completed')

            setTimeout(() => {
              const el = document.getElementById('pipeline-results-section')
              el?.scrollIntoView({ behavior: 'smooth' })
            }, 500)
          } else {
            setError('결과를 가져올 수 없습니다')
            setPhase('error')
          }
        } else if (data.status === 'error') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          setError(data.error || '파이프라인 오류 발생')
          setPhase('error')
        }
      } catch (e) {
        errorCountRef.current += 1
        logger.error('Pipeline progress fetch error', { error: e, count: errorCountRef.current })

        if (errorCountRef.current >= 5) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          setError('백엔드 서버 연결 실패 (5회 연속 에러)')
          setPhase('error')
        }
      }
    }, 2000)
  }, [apiUrl])

  const runPipeline = useCallback(async (config: PipelineConfig) => {
    if (!sessionId) {
      setError('먼저 파일을 업로드해주세요')
      return
    }

    setPhase('running')
    setError(null)
    setResults(null)

    try {
      // Radiance West-positive 규약: 경도/자오선 음수 변환
      const backendConfig: Record<string, unknown> = {
        latitude: config.latitude,
        longitude: -config.longitude,
        timezone: -config.timezone,
        dates: config.dates.map(d => ({
          month: d.month,
          day: d.day,
          label: d.label,
        })),
        hours: config.hours,
        xres: config.xres,
        yres: config.yres,
        quality: config.quality,
        sky_type: config.skyType,
      }
      if (config.materialOverrides && Object.keys(config.materialOverrides).length > 0) {
        backendConfig.material_overrides = config.materialOverrides
      }

      const res = await fetch(`${apiUrl}/pipeline/run/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendConfig),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: '파이프라인 시작 실패' }))
        throw new Error(errData.detail || '파이프라인 시작 실패')
      }

      setPhase('polling')
      startPolling(sessionId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '파이프라인 시작 중 오류 발생'
      setError(msg)
      setPhase('error')
      logger.error('Pipeline run error', err instanceof Error ? err : undefined)
    }
  }, [sessionId, apiUrl, startPolling])

  return {
    phase,
    sessionId,
    vfCount,
    progress,
    results,
    error,
    uploadFiles,
    runPipeline,
    reset,
  }
}
