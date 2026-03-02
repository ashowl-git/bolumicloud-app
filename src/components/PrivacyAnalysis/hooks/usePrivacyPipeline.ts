'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type {
  PrivacyConfigState,
  PrivacyConfig,
  PrivacyProgress,
  PrivacyAnalysisResult,
} from '@/lib/types/privacy'

export type PrivacyPipelinePhase =
  | 'idle'
  | 'uploading'
  | 'running'
  | 'polling'
  | 'completed'
  | 'error'

const SESSION_KEY = 'privacyPipelineSession'

const DEFAULT_CONFIG: PrivacyConfigState = {
  distanceThreshold: 100,
  subGridResolution: 3,
  piiThreshold: 0.0005,
  observerWindows: [],
  targetWindows: [],
}

export interface UsePrivacyPipelineReturn {
  phase: PrivacyPipelinePhase
  sessionId: string | null
  sceneUrl: string | null
  targetSceneUrl: string | null
  observerSceneUrl: string | null
  config: PrivacyConfigState
  progress: PrivacyProgress | null
  results: PrivacyAnalysisResult | null
  error: string | null
  isCancelled: boolean
  setConfig: (partial: Partial<PrivacyConfigState>) => void
  upload: (targetFile: File, observerFile: File) => Promise<void>
  run: () => Promise<void>
  cancel: () => Promise<void>
  reset: () => void
}

export function usePrivacyPipeline(apiUrl: string): UsePrivacyPipelineReturn {
  const [phase, setPhase] = useState<PrivacyPipelinePhase>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sceneUrl, setSceneUrl] = useState<string | null>(null)
  const [targetSceneUrl, setTargetSceneUrl] = useState<string | null>(null)
  const [observerSceneUrl, setObserverSceneUrl] = useState<string | null>(null)
  const [config, setConfigState] = useState<PrivacyConfigState>(DEFAULT_CONFIG)
  const [progress, setProgress] = useState<PrivacyProgress | null>(null)
  const [results, setResults] = useState<PrivacyAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCancelled, setIsCancelled] = useState(false)

  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const errorCountRef = useRef(0)

  // localStorage 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.sessionId) {
          setSessionId(data.sessionId)
          if (data.phase === 'completed' && data.results) {
            setPhase('completed')
            setResults(data.results)
          }
        }
      }
    } catch { /* ignore */ }
  }, [])

  const saveSession = useCallback((sid: string, p: PrivacyPipelinePhase, r?: PrivacyAnalysisResult) => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId: sid, phase: p, results: r || null }))
    } catch { /* ignore */ }
  }, [])

  const setConfig = useCallback((partial: Partial<PrivacyConfigState>) => {
    setConfigState((prev) => ({ ...prev, ...partial }))
  }, [])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const upload = useCallback(async (targetFile: File, observerFile: File) => {
    setPhase('uploading')
    setError(null)
    setResults(null)
    setIsCancelled(false)

    try {
      const form = new FormData()
      form.append('target_file', targetFile)
      form.append('observer_file', observerFile)

      const res = await fetch(`${apiUrl}/privacy/upload`, { method: 'POST', body: form })
      if (!res.ok) throw new Error(`업로드 실패: ${res.status}`)
      const data = await res.json()

      setSessionId(data.session_id)
      saveSession(data.session_id, 'idle')

      // 3D 프리뷰용: 두 OBJ를 각각 GLB로 변환
      const uploadModel = async (file: File): Promise<string | null> => {
        try {
          const form = new FormData()
          form.append('file', file)
          const res = await fetch(`${apiUrl}/models/upload`, { method: 'POST', body: form })
          if (res.ok) {
            const d = await res.json()
            return d.scene_url || null
          }
        } catch { /* ignore model conversion failure */ }
        return null
      }

      const [tUrl, oUrl] = await Promise.all([
        uploadModel(targetFile),
        uploadModel(observerFile),
      ])
      if (tUrl) { setTargetSceneUrl(`${apiUrl}${tUrl}`); setSceneUrl(`${apiUrl}${tUrl}`) }
      if (oUrl) setObserverSceneUrl(`${apiUrl}${oUrl}`)

      setPhase('idle')
    } catch (e) {
      setError(e instanceof Error ? e.message : '업로드 오류')
      setPhase('error')
    }
  }, [apiUrl, saveSession])

  const pollStatus = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`${apiUrl}/privacy/${sid}/status`)
      if (!res.ok) throw new Error(`상태 조회 실패: ${res.status}`)
      const data: PrivacyProgress = await res.json()
      setProgress(data)
      errorCountRef.current = 0

      if (data.status === 'completed') {
        stopPolling()
        const resultRes = await fetch(`${apiUrl}/privacy/${sid}/result`)
        if (resultRes.ok) {
          const resultData: PrivacyAnalysisResult = await resultRes.json()
          setResults(resultData)
          setPhase('completed')
          saveSession(sid, 'completed', resultData)
        }
      } else if (data.status === 'error') {
        stopPolling()
        setError(data.error || '분석 오류')
        setPhase('error')
      } else if (data.status === 'cancelled') {
        stopPolling()
        setIsCancelled(true)
        setPhase('idle')
      }
    } catch {
      errorCountRef.current += 1
      if (errorCountRef.current > 5) {
        stopPolling()
        setError('서버 연결 오류')
        setPhase('error')
      }
    }
  }, [apiUrl, stopPolling, saveSession])

  const run = useCallback(async () => {
    if (!sessionId) return

    setPhase('running')
    setError(null)
    setResults(null)

    const payload: PrivacyConfig = {
      distance_threshold: config.distanceThreshold,
      sub_grid_resolution: config.subGridResolution,
      pii_threshold: config.piiThreshold,
      observer_windows: config.observerWindows,
      target_windows: config.targetWindows,
    }

    try {
      const res = await fetch(`${apiUrl}/privacy/run?session_id=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`분석 실행 실패: ${res.status}`)

      setPhase('polling')
      errorCountRef.current = 0
      pollingRef.current = setInterval(() => pollStatus(sessionId), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : '실행 오류')
      setPhase('error')
    }
  }, [apiUrl, sessionId, config, pollStatus])

  const cancel = useCallback(async () => {
    if (!sessionId) return
    stopPolling()
    try {
      await fetch(`${apiUrl}/privacy/${sessionId}`, { method: 'DELETE' })
    } catch { /* ignore */ }
    setIsCancelled(true)
    setPhase('idle')
  }, [apiUrl, sessionId, stopPolling])

  const reset = useCallback(() => {
    stopPolling()
    setPhase('idle')
    setSessionId(null)
    setSceneUrl(null)
    setTargetSceneUrl(null)
    setObserverSceneUrl(null)
    setConfigState(DEFAULT_CONFIG)
    setProgress(null)
    setResults(null)
    setError(null)
    setIsCancelled(false)
    localStorage.removeItem(SESSION_KEY)
  }, [stopPolling])

  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  return {
    phase,
    sessionId,
    sceneUrl,
    targetSceneUrl,
    observerSceneUrl,
    config,
    progress,
    results,
    error,
    isCancelled,
    setConfig,
    upload,
    run,
    cancel,
    reset,
  }
}
