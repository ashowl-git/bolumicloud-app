import { useState, useRef, useEffect, useCallback } from 'react'
import type {
  SunlightConfig,
  SunlightProgress,
  SunlightAnalysisResult,
  SunlightUploadResponse,
} from '@/lib/types/sunlight'
import { logger } from '@/lib/logger'

interface UseSunlightPipelineOptions {
  apiUrl: string
}

export type SunlightPipelinePhase = 'idle' | 'uploading' | 'running' | 'polling' | 'completed' | 'error'

export interface UseSunlightPipelineReturn {
  phase: SunlightPipelinePhase
  sessionId: string | null
  progress: SunlightProgress | null
  results: SunlightAnalysisResult | null
  error: string | null
  isCancelled: boolean
  estimatedRemainingSec: number | null

  uploadFile: (objFile: File) => Promise<void>
  runAnalysis: (config: SunlightConfig) => Promise<void>
  cancelAnalysis: () => Promise<void>
  reset: () => void
}

const SESSION_KEY = 'sunlightPipelineSession'

function saveSession(sessionId: string, phase: SunlightPipelinePhase) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId, phase }))
  } catch { /* ignore */ }
}

function loadSession(): { sessionId: string; phase: SunlightPipelinePhase } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch { /* ignore */ }
}

export function useSunlightPipeline({ apiUrl }: UseSunlightPipelineOptions): UseSunlightPipelineReturn {
  const [phase, setPhase] = useState<SunlightPipelinePhase>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [progress, setProgress] = useState<SunlightProgress | null>(null)
  const [results, setResults] = useState<SunlightAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCancelled, setIsCancelled] = useState(false)
  const [estimatedRemainingSec, setEstimatedRemainingSec] = useState<number | null>(null)

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const errorCountRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [])

  // beforeunload warning
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
    setProgress(null)
    setResults(null)
    setError(null)
    setIsCancelled(false)
    setEstimatedRemainingSec(null)
    errorCountRef.current = 0
    startTimeRef.current = null
    clearSession()
  }, [])

  const startPolling = useCallback((sid: string) => {
    errorCountRef.current = 0
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now()
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${apiUrl}/sunlight/${sid}/status`)
        const data: SunlightProgress = await res.json()

        errorCountRef.current = 0
        setProgress(data)

        // ETA
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

          const resultsRes = await fetch(`${apiUrl}/sunlight/${sid}/result`)
          if (resultsRes.ok) {
            const resultsData: SunlightAnalysisResult = await resultsRes.json()
            setResults(resultsData)
            setPhase('completed')
            setEstimatedRemainingSec(null)
            clearSession()
          } else {
            setError('결과를 가져올 수 없습니다')
            setPhase('error')
            clearSession()
          }
        } else if (data.status === 'error') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          setError(data.error || '분석 오류 발생')
          setPhase('error')
          clearSession()
        }
      } catch (e) {
        errorCountRef.current += 1
        logger.error('Sunlight progress fetch error', { error: e, count: errorCountRef.current })

        if (errorCountRef.current >= 5) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          setError('백엔드 서버 연결 실패 (5회 연속 에러)')
          setPhase('error')
          clearSession()
        }
      }
    }, 2000)
  }, [apiUrl])

  // Session restore
  useEffect(() => {
    const session = loadSession()
    if (session && (session.phase === 'polling' || session.phase === 'running')) {
      setSessionId(session.sessionId)
      setPhase('polling')
      startPolling(session.sessionId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const uploadFile = useCallback(async (objFile: File) => {
    setPhase('uploading')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('obj_file', objFile)

      const res = await fetch(`${apiUrl}/sunlight/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: '업로드 실패' }))
        throw new Error(errData.detail || '파일 업로드 실패')
      }

      const data: SunlightUploadResponse = await res.json()
      setSessionId(data.session_id)
      setPhase('idle')
      logger.info('Sunlight upload success', { sessionId: data.session_id })
    } catch (err) {
      const msg = err instanceof Error ? err.message : '업로드 중 오류 발생'
      setError(msg)
      setPhase('error')
      logger.error('Sunlight upload error', err instanceof Error ? err : undefined)
    }
  }, [apiUrl])

  const runAnalysis = useCallback(async (config: SunlightConfig) => {
    if (!sessionId) {
      setError('먼저 파일을 업로드해주세요')
      return
    }

    setPhase('running')
    setError(null)
    setResults(null)
    setIsCancelled(false)
    saveSession(sessionId, 'running')

    try {
      const res = await fetch(`${apiUrl}/sunlight/run?session_id=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: '분석 시작 실패' }))
        throw new Error(errData.detail || '분석 시작 실패')
      }

      setPhase('polling')
      saveSession(sessionId, 'polling')
      startPolling(sessionId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '분석 시작 중 오류 발생'
      setError(msg)
      setPhase('error')
      logger.error('Sunlight run error', err instanceof Error ? err : undefined)
    }
  }, [sessionId, apiUrl, startPolling])

  const cancelAnalysis = useCallback(async () => {
    if (!sessionId) return
    try {
      await fetch(`${apiUrl}/sunlight/${sessionId}`, { method: 'DELETE' })
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      setIsCancelled(true)
      setPhase('idle')
      setEstimatedRemainingSec(null)
      startTimeRef.current = null
      clearSession()
      logger.info('Sunlight analysis cancelled', { sessionId })
    } catch (err) {
      logger.error('Sunlight cancel error', err instanceof Error ? err : undefined)
    }
  }, [sessionId, apiUrl])

  return {
    phase,
    sessionId,
    progress,
    results,
    error,
    isCancelled,
    estimatedRemainingSec,
    uploadFile,
    runAnalysis,
    cancelAnalysis,
    reset,
  }
}
