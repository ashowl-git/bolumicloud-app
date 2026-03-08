'use client'

import { useState, useCallback } from 'react'
import { useApiClient, buildUserMessage } from '@/lib/api'
import { useAnalysisPipeline } from '@/hooks/useAnalysisPipeline'
import type { SolarPVProgress, SolarPVResult, SolarPVRunConfig, PVModulePresetInfo } from '@/lib/types/solar-pv'

export type SolarPVPipelinePhase = 'idle' | 'uploading' | 'running' | 'polling' | 'completed' | 'error'

export interface SolarPVModelMeta {
  model_id: string
  original_name: string
  vertices: number
  faces: number
}

export interface SolarPVImportData {
  modelId: string
  sceneUrl: string
  groups: { name: string; vertexCount: number; faceCount: number; color?: string; visible: boolean }[]
}

export interface UseSolarPVPipelineReturn {
  // Pipeline state
  phase: SolarPVPipelinePhase
  sessionId: string | null
  modelId: string | null
  sceneUrl: string | null
  progress: SolarPVProgress | null
  results: SolarPVResult | null
  error: string | null
  isCancelled: boolean
  estimatedRemainingSec: number | null
  uploadProgress: number | null
  modulePresets: PVModulePresetInfo[]
  modelMeta: SolarPVModelMeta | null
  importData: SolarPVImportData | null

  // Actions
  uploadFile: (objFile: File, mtlFile?: File) => Promise<void>
  runAnalysis: (config: SolarPVRunConfig) => Promise<void>
  cancelAnalysis: () => Promise<void>
  reset: () => void
  fetchModulePresets: () => Promise<void>
}

const MODEL_INFO_KEY = 'solarPVModelInfo'
const LAYER_COLORS = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316']

export function useSolarPVPipeline({ apiUrl }: { apiUrl: string }): UseSolarPVPipelineReturn {
  const api = useApiClient()

  const pipeline = useAnalysisPipeline<SolarPVProgress, SolarPVResult>({
    module: 'solar_pv',
    statusPath: '/solar-pv/{sid}/status',
    resultPath: '/solar-pv/{sid}/result',
    cancelPath: '/solar-pv/{sid}',
    pollInterval: 3000,
  })

  const [modelId, setModelId] = useState<string | null>(null)
  const [sceneUrl, setSceneUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [modulePresets, setModulePresets] = useState<PVModulePresetInfo[]>([])
  const [modelMeta, setModelMeta] = useState<SolarPVModelMeta | null>(null)
  const [importData, setImportData] = useState<SolarPVImportData | null>(null)

  const uploadFile = useCallback(async (objFile: File, mtlFile?: File) => {
    pipeline.setPhase('uploading')
    pipeline.setError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', objFile)
      if (mtlFile) formData.append('mtl_file', mtlFile)

      const uploadResult = await api.postFormData('/import/obj', formData, {
        onProgress: (p: number) => setUploadProgress(Math.round(p * 100)),
      })

      const mid = uploadResult.model_id
      const fullSceneUrl = `${apiUrl}${uploadResult.scene_url}`
      setModelId(mid)
      setSceneUrl(fullSceneUrl)

      // Store model meta
      const meta: SolarPVModelMeta = {
        model_id: mid,
        original_name: uploadResult.original_name ?? objFile.name,
        vertices: uploadResult.vertices ?? 0,
        faces: uploadResult.faces ?? 0,
      }
      setModelMeta(meta)

      // Extract groups from upload response
      const rawGroups: string[] = Array.isArray(uploadResult.groups) ? uploadResult.groups : []
      const colorMap = new Map<string, string>()
      if (Array.isArray(uploadResult.group_colors)) {
        for (const gc of uploadResult.group_colors) {
          if (gc.color) colorMap.set(gc.name, gc.color)
        }
      }
      const groups = rawGroups.map((name: string, i: number) => ({
        name,
        vertexCount: 0,
        faceCount: 0,
        color: colorMap.get(name) || LAYER_COLORS[i % LAYER_COLORS.length],
        visible: true,
      }))

      if (groups.length > 0) {
        setImportData({
          modelId: mid,
          sceneUrl: uploadResult.scene_url,
          groups,
        })
      }

      // Register with solar-pv module
      const regResult = await api.post(`/solar-pv/register?model_id=${mid}`)
      pipeline.setSessionId(regResult.session_id)

      localStorage.setItem(MODEL_INFO_KEY, JSON.stringify({ modelId: mid, sceneUrl: fullSceneUrl }))

      pipeline.setPhase('idle')
      setUploadProgress(null)
    } catch (err) {
      pipeline.setError(buildUserMessage(err))
      pipeline.setPhase('error')
      setUploadProgress(null)
    }
  }, [api, apiUrl, pipeline])

  const runAnalysis = useCallback(async (config: SolarPVRunConfig) => {
    if (!pipeline.sessionId) {
      pipeline.setError('세션이 없습니다. 모델을 먼저 업로드하세요.')
      pipeline.setPhase('error')
      return
    }

    pipeline.setPhase('running')
    pipeline.setError(null)

    try {
      const response = await api.post(
        `/solar-pv/run?session_id=${pipeline.sessionId}`,
        config,
      )
      pipeline.setPhase('polling')
      pipeline.saveSession(response.session_id, 'polling')
      pipeline.startPolling(response.session_id)
    } catch (err) {
      pipeline.setError(buildUserMessage(err))
      pipeline.setPhase('error')
    }
  }, [api, pipeline])

  const fetchModulePresets = useCallback(async () => {
    try {
      const data = await api.get('/solar-pv/module-presets')
      setModulePresets(data.presets || [])
    } catch { /* ignore */ }
  }, [api])

  const reset = useCallback(() => {
    pipeline.reset()
    setModelId(null)
    setSceneUrl(null)
    setUploadProgress(null)
    setModelMeta(null)
    setImportData(null)
    localStorage.removeItem(MODEL_INFO_KEY)
  }, [pipeline])

  return {
    phase: pipeline.phase as SolarPVPipelinePhase,
    sessionId: pipeline.sessionId,
    modelId,
    sceneUrl,
    progress: pipeline.progress,
    results: pipeline.results,
    error: pipeline.error,
    isCancelled: pipeline.isCancelled,
    estimatedRemainingSec: pipeline.estimatedRemainingSec,
    uploadProgress,
    modulePresets,
    modelMeta,
    importData,
    uploadFile,
    runAnalysis,
    cancelAnalysis: pipeline.cancelAnalysis,
    reset,
    fetchModulePresets,
  }
}
