import { useState, useRef, useEffect, useCallback } from 'react'
import { useApiClient } from '@/lib/api'
import type { AnalysisResponse } from '@/lib/types/glare'
import type { PipelineConfig, PipelineProgress, PipelineUploadResponse } from '@/lib/types/pipeline'
import { logger } from '@/lib/logger'
import { savePipelineSession, loadPipelineSession, clearPipelineSession } from '@/lib/pipelineSession'

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
  isCancelled: boolean
  estimatedRemainingSec: number | null

  uploadFiles: (vfFiles: File[], objFile: File, mtlFile: File | null) => Promise<void>
  runPipeline: (config: PipelineConfig) => Promise<void>
  cancelPipeline: () => Promise<void>
  reset: () => void
  resetForRerun: () => void
}

export function usePipeline({ apiUrl: _apiUrl }: UsePipelineOptions): UsePipelineReturn {
  const api = useApiClient()
  const [phase, setPhase] = useState<PipelinePhase>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [vfCount, setVfCount] = useState(0)
  const [progress, setProgress] = useState<PipelineProgress | null>(null)
  const [results, setResults] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCancelled, setIsCancelled] = useState(false)
  const [estimatedRemainingSec, setEstimatedRemainingSec] = useState<number | null>(null)

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const errorCountRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [])

  // beforeunload warning when pipeline is active
  useEffect(() => {
    if (phase === 'running' || phase === 'polling') {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault()
        e.returnValue = ''
      }
      window.addEventListener('beforeunload', handler)
      return () => window.removeEventListener('beforeunload', handler)
    }
  }, [phase])

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
    setIsCancelled(false)
    setEstimatedRemainingSec(null)
    errorCountRef.current = 0
    startTimeRef.current = null
    clearPipelineSession()
  }, [])

  const resetForRerun = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    setPhase('idle')
    setProgress(null)
    setResults(null)
    setError(null)
    setIsCancelled(false)
    setEstimatedRemainingSec(null)
    errorCountRef.current = 0
    startTimeRef.current = null
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

      const data: PipelineUploadResponse = await api.postFormData('/pipeline/upload', formData)
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
  }, [api])

  const startPolling = useCallback((sid: string) => {
    errorCountRef.current = 0
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now()
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const data: PipelineProgress = await api.get(`/pipeline/progress/${sid}`)

        errorCountRef.current = 0
        setProgress(data)

        // ETA calculation
        if (data.overall_progress > 5 && startTimeRef.current !== null) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000
          const remaining = (elapsed / data.overall_progress) * (100 - data.overall_progress)
          setEstimatedRemainingSec(Math.round(remaining))
        } else {
          setEstimatedRemainingSec(null)
        }

        if (data.status === 'completed') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }

          try {
            const resultsData = await api.get(`/pipeline/results/${sid}`)
            setResults(resultsData)
            setPhase('completed')
            setEstimatedRemainingSec(null)
            clearPipelineSession()
          } catch {
            setError('결과를 가져올 수 없습니다')
            setPhase('error')
            clearPipelineSession()
          }
        } else if (data.status === 'error') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          setError(data.error || '파이프라인 오류 발생')
          setPhase('error')
          clearPipelineSession()
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
          clearPipelineSession()
        }
      }
    }, 2000)
  }, [api])

  // Session restore on mount
  useEffect(() => {
    const session = loadPipelineSession()
    if (session && (session.phase === 'polling' || session.phase === 'running')) {
      setSessionId(session.sessionId)
      setVfCount(session.vfCount)
      setPhase('polling')
      startPolling(session.sessionId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cancelPipeline = useCallback(async () => {
    if (!sessionId) return
    try {
      await api.post(`/pipeline/cancel/${sessionId}`)
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      setIsCancelled(true)
      setPhase('idle')
      setEstimatedRemainingSec(null)
      startTimeRef.current = null
      clearPipelineSession()
      logger.info('Pipeline cancelled', { sessionId })
    } catch (err) {
      logger.error('Pipeline cancel error', err instanceof Error ? err : undefined)
    }
  }, [sessionId, api])

  const runPipeline = useCallback(async (config: PipelineConfig) => {
    if (!sessionId) {
      setError('먼저 파일을 업로드해주세요')
      return
    }

    setPhase('running')
    setError(null)
    setResults(null)
    setIsCancelled(false)
    savePipelineSession(sessionId, 'running', vfCount)

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
      if (config.renderParams) {
        backendConfig.render_params = config.renderParams
      }

      await api.post(`/pipeline/run/${sessionId}`, backendConfig)

      setPhase('polling')
      savePipelineSession(sessionId, 'polling', vfCount)
      startPolling(sessionId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '파이프라인 시작 중 오류 발생'
      setError(msg)
      setPhase('error')
      logger.error('Pipeline run error', err instanceof Error ? err : undefined)
    }
  }, [sessionId, vfCount, api, startPolling])

  return {
    phase,
    sessionId,
    vfCount,
    progress,
    results,
    error,
    isCancelled,
    estimatedRemainingSec,
    uploadFiles,
    runPipeline,
    cancelPipeline,
    reset,
    resetForRerun,
  }
}
