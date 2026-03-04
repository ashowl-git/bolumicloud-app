import { useState, useCallback } from 'react'
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

export function useViewPipeline({ apiUrl }: UseViewPipelineOptions): UseViewPipelineReturn {
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

  const reset = useCallback(() => {
    base.reset()
    setSceneUrl(null)
    setModelMeta(null)
  }, [base])

  const uploadFile = useCallback(async (objFile: File) => {
    base.setPhase('uploading')
    base.setError(null)

    try {
      // 1) View upload (analysis engine)
      const formData = new FormData()
      formData.append('obj_file', objFile)

      const data: ViewUploadResponse = await api.postFormData('/view/upload', formData)
      base.setSessionId(data.session_id)

      // 2) 3D model upload (GLB conversion + viewer)
      const modelFormData = new FormData()
      modelFormData.append('file', objFile)

      try {
        const modelData: ModelMetadata = await api.postFormData('/models/upload', modelFormData)
        setSceneUrl(`${contextApiUrl}${modelData.scene_url}`)
        setModelMeta(modelData)
      } catch {
        logger.warn('Model upload failed, 3D preview unavailable')
      }

      base.setPhase('idle')
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
