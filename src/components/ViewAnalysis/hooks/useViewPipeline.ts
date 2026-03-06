import { useState, useCallback, useEffect } from 'react'
import { useApiClient } from '@/lib/api'
import { useApi } from '@/contexts/ApiContext'
import { useAnalysisPipeline } from '@/hooks/useAnalysisPipeline'
import type {
  ViewConfig,
  ViewProgress,
  ViewAnalysisResult,
  ViewUploadResponse,
} from '@/lib/types/view'
import type { ModelMetadata } from '@/lib/types/sunlight'
import { logger } from '@/lib/logger'

// ── Model info persistence ──
const VIEW_MODEL_KEY = 'viewModelInfo'

function persistViewModelInfo(sceneUrl: string, modelMeta: ModelMetadata | null) {
  try { localStorage.setItem(VIEW_MODEL_KEY, JSON.stringify({ sceneUrl, modelMeta })) } catch { /* ignore */ }
}

function restoreViewModelInfo(): { sceneUrl: string; modelMeta: ModelMetadata | null } | null {
  try {
    const raw = localStorage.getItem(VIEW_MODEL_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function clearViewModelInfo() {
  try { localStorage.removeItem(VIEW_MODEL_KEY) } catch { /* ignore */ }
}

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

export function useViewPipeline({ apiUrl: _apiUrl }: UseViewPipelineOptions): UseViewPipelineReturn {
  const api = useApiClient()
  const { apiUrl: contextApiUrl } = useApi()
  const base = useAnalysisPipeline<ViewProgress, ViewAnalysisResult>({
    module: 'view',
    statusPath: '/view/{sid}/status',
    resultPath: '/view/{sid}/result',
    cancelPath: '/view/{sid}',
  })

  // View-specific extra state
  const [sceneUrl, setSceneUrl] = useState<string | null>(null)
  const [modelMeta, setModelMeta] = useState<ModelMetadata | null>(null)

  // Restore model info on mount when session is being resumed
  useEffect(() => {
    if (base.phase === 'polling' && base.sessionId && !sceneUrl) {
      const info = restoreViewModelInfo()
      if (info) {
        setSceneUrl(info.sceneUrl)
        setModelMeta(info.modelMeta)
        logger.info('View model info restored', { sceneUrl: info.sceneUrl })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base.phase, base.sessionId])

  const reset = useCallback(() => {
    base.reset()
    setSceneUrl(null)
    setModelMeta(null)
    clearViewModelInfo()
  }, [base])

  const uploadFile = useCallback(async (objFile: File) => {
    base.setPhase('uploading')
    base.setError(null)

    try {
      // 1) /import/obj: GLB 변환 + 3D 시각화
      const formData = new FormData()
      formData.append('file', objFile)

      const importRes = await api.postFormData('/import/obj', formData)
      const fullUrl = `${contextApiUrl}${importRes.scene_url}`
      setSceneUrl(fullUrl)
      setModelMeta({
        model_id: importRes.model_id,
        scene_url: importRes.scene_url,
        original_name: objFile.name,
        format: 'glb',
        vertices: importRes.vertices ?? 0,
        faces: importRes.faces ?? 0,
        bounds_min: [0, 0, 0],
        bounds_max: [0, 0, 0],
      })
      persistViewModelInfo(fullUrl, {
        model_id: importRes.model_id,
        scene_url: importRes.scene_url,
        original_name: objFile.name,
        format: 'glb',
        vertices: importRes.vertices ?? 0,
        faces: importRes.faces ?? 0,
        bounds_min: [0, 0, 0],
        bounds_max: [0, 0, 0],
      })

      // 2) /view/register: 분석 세션 등록 (파일 재전송 없음)
      const data: ViewUploadResponse = await api.post(
        `/view/register?model_id=${importRes.model_id}`
      )
      base.setSessionId(data.session_id)

      base.setPhase('idle')
      logger.info('View import success', { sessionId: data.session_id, modelId: importRes.model_id })
    } catch (err) {
      const msg = err instanceof Error ? err.message : '업로드 중 오류 발생'
      base.setError(msg)
      base.setPhase('error')
    }
  }, [api, contextApiUrl, base])

  const runAnalysis = useCallback(async (config: ViewConfig) => {
    if (!base.sessionId) {
      base.setError('먼저 파일을 업로드해주세요')
      return
    }

    base.setPhase('running')
    base.setError(null)
    base.saveSession(base.sessionId, 'running')

    try {
      await api.post(`/view/run?session_id=${base.sessionId}`, config)

      base.setPhase('polling')
      base.saveSession(base.sessionId, 'polling')
      base.startPolling(base.sessionId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '분석 시작 중 오류 발생'
      base.setError(msg)
      base.setPhase('error')
    }
  }, [base, api])

  return {
    phase: base.phase,
    sessionId: base.sessionId,
    sceneUrl,
    modelMeta,
    progress: base.progress,
    results: base.results,
    error: base.error,
    isCancelled: base.isCancelled,
    estimatedRemainingSec: base.estimatedRemainingSec,
    uploadFile,
    runAnalysis,
    cancelAnalysis: base.cancelAnalysis,
    reset,
  }
}
