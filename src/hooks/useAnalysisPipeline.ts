'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useApiClient, ApiError, buildUserMessage } from '@/lib/api'
import { logger } from '@/lib/logger'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PipelinePhase = 'idle' | 'uploading' | 'running' | 'polling' | 'completed' | 'error'

export interface AnalysisPipelineOptions {
  /** Module name for logging and localStorage key, e.g. 'sunlight', 'view', 'privacy' */
  module: string
  /** @deprecated No longer used; useApiClient provides the base URL */
  apiUrl?: string
  /** Path template for status polling: {sid} is replaced with sessionId */
  statusPath: string
  /** Path template for fetching results: {sid} is replaced with sessionId */
  resultPath: string
  /** Path template for cancelling: {sid} is replaced with sessionId */
  cancelPath: string
  /** Optional: validate result data before accepting. Return error string or null. */
  validateResult?: (data: unknown) => string | null
  /** Polling interval in ms (default: 2000) */
  pollInterval?: number
  /** Max consecutive errors before failing (default: 5) */
  maxErrors?: number
}

export interface AnalysisPipelineState<TProgress, TResult> {
  phase: PipelinePhase
  sessionId: string | null
  progress: TProgress | null
  results: TResult | null
  error: string | null
  isCancelled: boolean
  estimatedRemainingSec: number | null
}

export interface AnalysisPipelineActions {
  setPhase: (phase: PipelinePhase) => void
  setSessionId: (id: string | null) => void
  setError: (error: string | null) => void
  startPolling: (sessionId: string) => void
  stopPolling: () => void
  saveSession: (sessionId: string, phase: PipelinePhase) => void
  cancelAnalysis: () => Promise<void>
  reset: () => void
}

export interface UseAnalysisPipelineReturn<TProgress, TResult>
  extends AnalysisPipelineState<TProgress, TResult>,
    AnalysisPipelineActions {}

// ---------------------------------------------------------------------------
// Session persistence helpers
// ---------------------------------------------------------------------------

function makeSessionKey(module: string): string {
  return `${module}PipelineSession`
}

function persistSession(key: string, sessionId: string, phase: PipelinePhase) {
  try {
    localStorage.setItem(key, JSON.stringify({ sessionId, phase }))
  } catch { /* ignore */ }
}

function restoreSession(key: string): { sessionId: string; phase: PipelinePhase } | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function clearPersistedSession(key: string) {
  try {
    localStorage.removeItem(key)
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAnalysisPipeline<
  TProgress extends { status: string; overall_progress: number; error?: string | null },
  TResult = unknown,
>(options: AnalysisPipelineOptions): UseAnalysisPipelineReturn<TProgress, TResult> {
  const {
    module,
    statusPath,
    resultPath,
    cancelPath,
    validateResult,
    pollInterval = 2000,
    maxErrors = 5,
  } = options

  const api = useApiClient()
  const sessionKey = makeSessionKey(module)

  // State
  const [phase, setPhase] = useState<PipelinePhase>('idle')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [progress, setProgress] = useState<TProgress | null>(null)
  const [results, setResults] = useState<TResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCancelled, setIsCancelled] = useState(false)
  const [estimatedRemainingSec, setEstimatedRemainingSec] = useState<number | null>(null)

  // Refs
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const errorCountRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [])

  // ── beforeunload warning ──
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

  // ── Stop polling helper ──
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [])

  // ── Reset ──
  const reset = useCallback(() => {
    stopPolling()
    setPhase('idle')
    setSessionId(null)
    setProgress(null)
    setResults(null)
    setError(null)
    setIsCancelled(false)
    setEstimatedRemainingSec(null)
    errorCountRef.current = 0
    startTimeRef.current = null
    clearPersistedSession(sessionKey)
  }, [stopPolling, sessionKey])

  // ── Session persistence ──
  const saveSession = useCallback((sid: string, p: PipelinePhase) => {
    persistSession(sessionKey, sid, p)
  }, [sessionKey])

  // ── Polling ──
  const startPolling = useCallback((sid: string) => {
    errorCountRef.current = 0
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now()
    }

    const statusUrl = statusPath.replace('{sid}', sid)
    const resultUrlPath = resultPath.replace('{sid}', sid)

    pollIntervalRef.current = setInterval(async () => {
      try {
        const data: TProgress = await api.get(statusUrl)

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
          stopPolling()

          try {
            const resultsData = await api.get(resultUrlPath)
            const validationError = validateResult?.(resultsData)
            if (validationError) {
              setError(validationError)
              setPhase('error')
            } else {
              setResults(resultsData as TResult)
              setPhase('completed')
            }
          } catch (resultErr) {
            setError(buildUserMessage(resultErr))
            setPhase('error')
          }
          setEstimatedRemainingSec(null)
          clearPersistedSession(sessionKey)
        } else if (data.status === 'error') {
          stopPolling()
          setError(data.error || '분석 오류 발생')
          setPhase('error')
          clearPersistedSession(sessionKey)
        } else if (data.status === 'cancelled') {
          stopPolling()
          setIsCancelled(true)
          setPhase('idle')
          clearPersistedSession(sessionKey)
        }
      } catch (e) {
        errorCountRef.current += 1
        logger.error(`${module} progress fetch error`, { error: e, count: errorCountRef.current })

        if (errorCountRef.current >= maxErrors) {
          stopPolling()
          const msg = (e instanceof ApiError || e instanceof TypeError)
            ? buildUserMessage(e)
            : `백엔드 서버 연결 실패 (${maxErrors}회 연속 오류)`
          setError(msg)
          setPhase('error')
          clearPersistedSession(sessionKey)
        }
      }
    }, pollInterval)
  }, [api, statusPath, resultPath, module, maxErrors, pollInterval, stopPolling, sessionKey, validateResult])

  // ── Session restore on mount ──
  useEffect(() => {
    const session = restoreSession(sessionKey)
    if (session && (session.phase === 'polling' || session.phase === 'running')) {
      setSessionId(session.sessionId)
      setPhase('polling')
      startPolling(session.sessionId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Cancel ──
  const cancelAnalysis = useCallback(async () => {
    if (!sessionId) return
    try {
      await api.del(cancelPath.replace('{sid}', sessionId))
    } catch (err) {
      logger.error(`${module} cancel error`, err instanceof Error ? err : undefined)
    }
    stopPolling()
    setIsCancelled(true)
    setPhase('idle')
    setEstimatedRemainingSec(null)
    startTimeRef.current = null
    clearPersistedSession(sessionKey)
  }, [sessionId, api, cancelPath, module, stopPolling, sessionKey])

  return {
    // State
    phase,
    sessionId,
    progress,
    results,
    error,
    isCancelled,
    estimatedRemainingSec,
    // Actions
    setPhase,
    setSessionId,
    setError,
    startPolling,
    stopPolling,
    saveSession,
    cancelAnalysis,
    reset,
  }
}
