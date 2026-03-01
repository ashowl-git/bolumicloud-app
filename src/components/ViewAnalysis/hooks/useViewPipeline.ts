import { useState, useRef, useEffect, useCallback } from 'react'
import type {
  ViewConfig,
  ViewProgress,
  ViewAnalysisResult,
  ViewUploadResponse,
} from '@/lib/types/view'
import type { ModelMetadata } from '@/lib/types/sunlight'
import { logger } from '@/lib/logger'

interface UseViewPipelineOptions {
  apiUrl: string
}

export type ViewPipelinePhase = 'idle' | 'uploading' | 'running' | 'polling' | 'completed' | 'error'

export interface UseViewPipelineReturn {
  phase: ViewPipelinePhase
  sessionId: string | null
  sceneUrl: string | null
  modelMeta: ModelMetadata | null
  progress: ViewProgress | null
  results: ViewAnalysisResult | null
  error: string | null
  isCancelled: boolean
  estimatedRemainingSec: number | null

  uploadFile: (objFile: File) => Promise<void>
  runAnalysis: (config: ViewConfig) => Promise<void>
  cancelAnalysis: () => Promise<void>
  reset: () => void
}

const SESSION_KEY = 'viewPipelineSession'

function saveSession(sessionId: string, phase: ViewPipelinePhase) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId, phase }))
  } catch { /* ignore */ }
}

function loadSession(): { sessionId: string; phase: ViewPipelinePhase } | null {
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

export function useViewPipeline({ apiUrl }: UseViewPipelineOptions): UseViewPipelineReturn {
  const [phase, setPhase] = useState<ViewPipelinePhase>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sceneUrl, setSceneUrl] = useState<string | null>(null)
  const [modelMeta, setModelMeta] = useState<ModelMetadata | null>(null)
  const [progress, setProgress] = useState<ViewProgress | null>(null)
  const [results, setResults] = useState<ViewAnalysisResult | null>(null)
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
    setSceneUrl(null)
    setModelMeta(null)
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
        const res = await fetch(`${apiUrl}/view/${sid}/status`)
        const data: ViewProgress = await res.json()

        errorCountRef.current = 0
        setProgress(data)

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

          const resultsRes = await fetch(`${apiUrl}/view/${sid}/result`)
          if (resultsRes.ok) {
            const resultsData: ViewAnalysisResult = await resultsRes.json()
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
        logger.error('View progress fetch error', { error: e, count: errorCountRef.current })

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
      // 1) View 업로드 (분석 엔진용)
      const formData = new FormData()
      formData.append('obj_file', objFile)

      const res = await fetch(`${apiUrl}/view/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: '업로드 실패' }))
        throw new Error(errData.detail || '파일 업로드 실패')
      }

      const data: ViewUploadResponse = await res.json()
      setSessionId(data.session_id)

      // 2) 3D 모델 업로드 (GLB 변환 + 뷰어용)
      const modelFormData = new FormData()
      modelFormData.append('file', objFile)

      const modelRes = await fetch(`${apiUrl}/models/upload`, {
        method: 'POST',
        body: modelFormData,
      })

      if (modelRes.ok) {
        const modelData: ModelMetadata = await modelRes.json()
        setSceneUrl(`${apiUrl}${modelData.scene_url}`)
        setModelMeta(modelData)
      } else {
        logger.warn('Model upload failed, 3D preview unavailable')
      }

      setPhase('idle')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '업로드 중 오류 발생'
      setError(msg)
      setPhase('error')
    }
  }, [apiUrl])

  const runAnalysis = useCallback(async (config: ViewConfig) => {
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
      const res = await fetch(`${apiUrl}/view/run?session_id=${sessionId}`, {
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
    }
  }, [sessionId, apiUrl, startPolling])

  const cancelAnalysis = useCallback(async () => {
    if (!sessionId) return
    try {
      await fetch(`${apiUrl}/view/${sessionId}`, { method: 'DELETE' })
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      setIsCancelled(true)
      setPhase('idle')
      setEstimatedRemainingSec(null)
      startTimeRef.current = null
      clearSession()
    } catch (err) {
      logger.error('View cancel error', err instanceof Error ? err : undefined)
    }
  }, [sessionId, apiUrl])

  return {
    phase,
    sessionId,
    sceneUrl,
    modelMeta,
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
