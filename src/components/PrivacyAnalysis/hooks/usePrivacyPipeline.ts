'use client'

import { useState, useCallback, useEffect } from 'react'
import { useApiClient } from '@/lib/api'
import { useApi } from '@/contexts/ApiContext'
import { useAnalysisPipeline } from '@/hooks/useAnalysisPipeline'
import type {
  PrivacyConfigState,
  PrivacyConfig,
  PrivacyProgress,
  PrivacyAnalysisResult,
} from '@/lib/types/privacy'

// ── Model info persistence ──
const PRIVACY_MODEL_KEY = 'privacyModelInfo'

function persistPrivacyModelInfo(sceneUrl: string, targetSceneUrl: string | null, observerSceneUrl: string | null) {
  try { localStorage.setItem(PRIVACY_MODEL_KEY, JSON.stringify({ sceneUrl, targetSceneUrl, observerSceneUrl })) } catch { /* ignore */ }
}

function restorePrivacyModelInfo(): { sceneUrl: string; targetSceneUrl: string | null; observerSceneUrl: string | null } | null {
  try {
    const raw = localStorage.getItem(PRIVACY_MODEL_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function clearPrivacyModelInfo() {
  try { localStorage.removeItem(PRIVACY_MODEL_KEY) } catch { /* ignore */ }
}

export type PrivacyPipelinePhase =
  | 'idle'
  | 'uploading'
  | 'running'
  | 'polling'
  | 'completed'
  | 'error'

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

export function usePrivacyPipeline(_apiUrl: string): UsePrivacyPipelineReturn {
  const api = useApiClient()
  const { apiUrl: contextApiUrl } = useApi()
  const base = useAnalysisPipeline<PrivacyProgress, PrivacyAnalysisResult>({
    module: 'privacy',
    statusPath: '/privacy/{sid}/status',
    resultPath: '/privacy/{sid}/result',
    cancelPath: '/privacy/{sid}',
  })

  // Privacy-specific extra state
  const [sceneUrl, setSceneUrl] = useState<string | null>(null)
  const [targetSceneUrl, setTargetSceneUrl] = useState<string | null>(null)
  const [observerSceneUrl, setObserverSceneUrl] = useState<string | null>(null)
  const [config, setConfigState] = useState<PrivacyConfigState>(DEFAULT_CONFIG)

  const setConfig = useCallback((partial: Partial<PrivacyConfigState>) => {
    setConfigState((prev) => ({ ...prev, ...partial }))
  }, [])

  // Restore model info on mount when session is being resumed
  useEffect(() => {
    if (base.phase === 'polling' && base.sessionId && !sceneUrl) {
      const info = restorePrivacyModelInfo()
      if (info) {
        setSceneUrl(info.sceneUrl)
        setTargetSceneUrl(info.targetSceneUrl)
        setObserverSceneUrl(info.observerSceneUrl)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base.phase, base.sessionId])

  const reset = useCallback(() => {
    base.reset()
    setSceneUrl(null)
    setTargetSceneUrl(null)
    setObserverSceneUrl(null)
    setConfigState(DEFAULT_CONFIG)
    clearPrivacyModelInfo()
  }, [base])

  const upload = useCallback(async (targetFile: File, observerFile: File) => {
    base.setPhase('uploading')
    base.setError(null)

    try {
      const form = new FormData()
      form.append('target_file', targetFile)
      form.append('observer_file', observerFile)

      const data = await api.postFormData('/privacy/upload', form)

      base.setSessionId(data.session_id)
      base.saveSession(data.session_id, 'idle')

      // 3D preview: convert both OBJ to GLB
      const uploadModel = async (file: File): Promise<string | null> => {
        try {
          const f = new FormData()
          f.append('file', file)
          const d = await api.postFormData('/models/upload', f)
          return d.scene_url || null
        } catch { /* ignore model conversion failure */ }
        return null
      }

      const [tUrl, oUrl] = await Promise.all([
        uploadModel(targetFile),
        uploadModel(observerFile),
      ])
      const fullTargetUrl = tUrl ? `${contextApiUrl}${tUrl}` : null
      const fullObserverUrl = oUrl ? `${contextApiUrl}${oUrl}` : null
      if (fullTargetUrl) { setTargetSceneUrl(fullTargetUrl); setSceneUrl(fullTargetUrl) }
      if (fullObserverUrl) setObserverSceneUrl(fullObserverUrl)
      if (fullTargetUrl) persistPrivacyModelInfo(fullTargetUrl, fullTargetUrl, fullObserverUrl)

      base.setPhase('idle')
    } catch (e) {
      base.setError(e instanceof Error ? e.message : '업로드 오류')
      base.setPhase('error')
    }
  }, [api, contextApiUrl, base])

  const run = useCallback(async () => {
    if (!base.sessionId) return

    base.setPhase('running')
    base.setError(null)

    const payload: PrivacyConfig = {
      distance_threshold: config.distanceThreshold,
      sub_grid_resolution: config.subGridResolution,
      pii_threshold: config.piiThreshold,
      observer_windows: config.observerWindows,
      target_windows: config.targetWindows,
    }

    try {
      await api.post(`/privacy/run?session_id=${base.sessionId}`, payload)

      base.setPhase('polling')
      base.startPolling(base.sessionId)
    } catch (e) {
      base.setError(e instanceof Error ? e.message : '실행 오류')
      base.setPhase('error')
    }
  }, [api, base, config])

  return {
    phase: base.phase,
    sessionId: base.sessionId,
    sceneUrl,
    targetSceneUrl,
    observerSceneUrl,
    config,
    progress: base.progress,
    results: base.results,
    error: base.error,
    isCancelled: base.isCancelled,
    setConfig,
    upload,
    run,
    cancel: base.cancelAnalysis,
    reset,
  }
}
