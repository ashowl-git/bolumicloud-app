import { useState, useCallback } from 'react'
import { useApiClient, buildUserMessage } from '@/lib/api'
import { useApi } from '@/contexts/ApiContext'
import { useAnalysisPipeline } from '@/hooks/useAnalysisPipeline'
import type {
  SunlightConfig,
  SunlightProgress,
  SunlightAnalysisResult,
  SunlightUploadResponse,
  ModelMetadata,
  Sn5fImportData,
  BuildingGroupInfo,
  Sn5fConditions,
  Sn5fMeasurementGroup,
} from '@/lib/types/sunlight'
import { logger } from '@/lib/logger'

interface UseSunlightPipelineOptions {
  apiUrl: string
}

export type SunlightPipelinePhase = 'idle' | 'uploading' | 'running' | 'polling' | 'completed' | 'error'

export interface UseSunlightPipelineReturn {
  phase: SunlightPipelinePhase
  sessionId: string | null
  modelId: string | null
  sceneUrl: string | null
  modelMeta: ModelMetadata | null
  progress: SunlightProgress | null
  results: SunlightAnalysisResult | null
  error: string | null
  isCancelled: boolean
  estimatedRemainingSec: number | null
  importData: Sn5fImportData | null

  uploadFile: (objFile: File) => Promise<void>
  runAnalysis: (config: SunlightConfig) => Promise<void>
  cancelAnalysis: () => Promise<void>
  reset: () => void
}

const GROUP_COLORS = [
  '#7CB9E8', '#B284BE', '#72BF6A', '#F0A868', '#E8747C',
  '#6ECFCF', '#D4A76A', '#9B9B9B', '#A8D8B9', '#C4B5E0',
]

function validateSunlightResult(data: unknown): string | null {
  const d = data as Record<string, unknown>
  if (!d || !d.points || !Array.isArray(d.points)) {
    return '분석 결과 형식이 올바르지 않습니다'
  }
  return null
}

export function useSunlightPipeline({ apiUrl }: UseSunlightPipelineOptions): UseSunlightPipelineReturn {
  const api = useApiClient()
  const { apiUrl: contextApiUrl } = useApi()
  const base = useAnalysisPipeline<SunlightProgress, SunlightAnalysisResult>({
    module: 'sunlight',
    statusPath: '/sunlight/{sid}/status',
    resultPath: '/sunlight/{sid}/result',
    cancelPath: '/sunlight/{sid}',
    validateResult: validateSunlightResult,
  })

  // Sunlight-specific extra state
  const [modelId, setModelId] = useState<string | null>(null)
  const [sceneUrl, setSceneUrl] = useState<string | null>(null)
  const [modelMeta, setModelMeta] = useState<ModelMetadata | null>(null)
  const [importData, setImportData] = useState<Sn5fImportData | null>(null)

  const reset = useCallback(() => {
    base.reset()
    setModelId(null)
    setSceneUrl(null)
    setModelMeta(null)
    setImportData(null)
  }, [base])

  const uploadFile = useCallback(async (objFile: File) => {
    base.setPhase('uploading')
    base.setError(null)
    setImportData(null)

    const ext = objFile.name.split('.').pop()?.toLowerCase()

    try {
      // ── SN5F: POST /import/sn5f ──
      if (ext === 'sn5f') {
        const formData = new FormData()
        formData.append('file', objFile)

        const data = await api.postFormData('/import/sn5f', formData)

        const rawGroups = Array.isArray(data.groups) ? data.groups : []
        const groups: BuildingGroupInfo[] = (rawGroups as string[]).map((name: string, i: number) => ({
          name,
          vertexCount: 0,
          faceCount: 0,
          color: GROUP_COLORS[i % GROUP_COLORS.length],
          visible: true,
        }))

        const cond = data.conditions
        const conditions: Sn5fConditions | null = cond && Object.keys(cond).length > 0 ? {
          azimuth: cond.azimuth,
          month: cond.month,
          day: cond.day,
          latitude: cond.latitude,
          longitude: cond.longitude,
          standardMeridian: cond.standard_meridian,
          solarTimeMode: cond.solar_time_mode,
          continuousStart: cond.continuous_sun_start,
          continuousEnd: cond.continuous_sun_end,
          continuousThresholdHour: cond.continuous_sun_threshold != null ? Math.floor(cond.continuous_sun_threshold / 60) : undefined,
          continuousThresholdMin: cond.continuous_sun_threshold != null ? cond.continuous_sun_threshold % 60 : undefined,
          totalStart: cond.total_sun_start,
          totalEnd: cond.total_sun_end,
          totalThresholdHour: cond.total_sun_threshold != null ? Math.floor(cond.total_sun_threshold / 60) : undefined,
          totalThresholdMin: cond.total_sun_threshold != null ? cond.total_sun_threshold % 60 : undefined,
        } : null

        const measurementGroups: Sn5fMeasurementGroup[] = (data.measurement_points || []).map((g: Record<string, unknown>) => ({
          groupName: g.group_name as string,
          points: (g.points as Record<string, unknown>[]).map((p: Record<string, unknown>) => ({
            id: p.id as string,
            x: p.x as number, y: p.y as number, z: p.z as number,
            name: p.name as string,
            lightTimes: p.light_times as { intervals: [number, number][] }[],
          })),
        }))

        const sn5fData: Sn5fImportData = {
          sessionId: data.session_id,
          modelId: data.model_id,
          sceneUrl: data.scene_url,
          groups,
          conditions,
          measurementGroups,
          layers: (data.layers || []).map((l: Record<string, unknown>) => ({
            name: l.name as string,
            layerType: l.layer_type as number,
            visible: l.visible as boolean,
            parentName: l.parent_name as string,
          })),
        }

        setImportData(sn5fData)
        base.setSessionId(sn5fData.sessionId)
        setModelId(sn5fData.modelId)
        setSceneUrl(`${contextApiUrl}${sn5fData.sceneUrl}`)
        base.setPhase('idle')
        logger.info('SN5F import success', { sessionId: sn5fData.sessionId, groups: groups.length })
        return
      }

      // ── OBJ: POST /import/obj ──
      if (ext === 'obj') {
        const formData = new FormData()
        formData.append('file', objFile)

        const importDataRes = await api.postFormData('/import/obj', formData)
        setModelId(importDataRes.model_id)
        setSceneUrl(`${contextApiUrl}${importDataRes.scene_url}`)

        const analysisFormData = new FormData()
        analysisFormData.append('obj_file', objFile)

        const analysisData: SunlightUploadResponse = await api.postFormData('/sunlight/upload', analysisFormData)
        base.setSessionId(analysisData.session_id)
        base.setPhase('idle')
        logger.info('OBJ import success', { sessionId: analysisData.session_id, modelId: importDataRes.model_id })
        return
      }

      // ── Fallback path (unknown extension) ──
      const formData = new FormData()
      formData.append('obj_file', objFile)

      const data: SunlightUploadResponse = await api.postFormData('/sunlight/upload', formData)
      base.setSessionId(data.session_id)

      const modelFormData = new FormData()
      modelFormData.append('file', objFile)
      try {
        const modelData: ModelMetadata = await api.postFormData('/models/upload', modelFormData)
        setModelId(modelData.model_id)
        setSceneUrl(`${contextApiUrl}${modelData.scene_url}`)
        setModelMeta(modelData)
        logger.info('Model upload success', { modelId: modelData.model_id })
      } catch {
        logger.warn('Model upload failed, 3D preview unavailable')
      }

      base.setPhase('idle')
      logger.info('Sunlight upload success', { sessionId: data.session_id })
    } catch (err) {
      const msg = buildUserMessage(err)
      base.setError(msg)
      base.setPhase('error')
      logger.error('Sunlight upload error', err instanceof Error ? err : undefined)
    }
  }, [api, contextApiUrl, base])

  const runAnalysis = useCallback(async (config: SunlightConfig) => {
    if (!base.sessionId) {
      base.setError('먼저 파일을 업로드해주세요')
      return
    }

    base.setPhase('running')
    base.setError(null)
    base.saveSession(base.sessionId, 'running')

    try {
      await api.post(`/sunlight/run?session_id=${base.sessionId}`, config)

      base.setPhase('polling')
      base.saveSession(base.sessionId, 'polling')
      base.startPolling(base.sessionId)
    } catch (err) {
      const msg = buildUserMessage(err)
      base.setError(msg)
      base.setPhase('error')
      logger.error('Sunlight run error', err instanceof Error ? err : undefined)
    }
  }, [base, api])

  return {
    phase: base.phase,
    sessionId: base.sessionId,
    modelId,
    sceneUrl,
    modelMeta,
    progress: base.progress,
    results: base.results,
    error: base.error,
    isCancelled: base.isCancelled,
    estimatedRemainingSec: base.estimatedRemainingSec,
    importData,
    uploadFile,
    runAnalysis,
    cancelAnalysis: base.cancelAnalysis,
    reset,
  }
}
