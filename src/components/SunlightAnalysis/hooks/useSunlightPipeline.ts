import { useState, useCallback, useEffect } from 'react'
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

  windowPoints: Array<{ id: string; x: number; y: number; z: number; name: string; group: string }>
  uploadFile: (objFile: File, mtlFile?: File) => Promise<void>
  runAnalysis: (config: SunlightConfig) => Promise<void>
  cancelAnalysis: () => Promise<void>
  reset: () => void
}

const GROUP_COLORS = [
  '#7CB9E8', '#B284BE', '#72BF6A', '#F0A868', '#E8747C',
  '#6ECFCF', '#D4A76A', '#9B9B9B', '#A8D8B9', '#C4B5E0',
]

// ── Model info persistence (session restore) ──
const MODEL_INFO_KEY = 'sunlightModelInfo'

interface PersistedModelInfo {
  sceneUrl: string
  modelId: string
  modelMeta: ModelMetadata | null
}

function persistModelInfo(info: PersistedModelInfo) {
  try { localStorage.setItem(MODEL_INFO_KEY, JSON.stringify(info)) } catch { /* ignore */ }
}

function restoreModelInfo(): PersistedModelInfo | null {
  try {
    const raw = localStorage.getItem(MODEL_INFO_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function clearModelInfo() {
  try { localStorage.removeItem(MODEL_INFO_KEY) } catch { /* ignore */ }
}

function validateSunlightResult(data: unknown): string | null {
  const d = data as Record<string, unknown>
  if (!d || !d.points || !Array.isArray(d.points)) {
    return '분석 결과 형식이 올바르지 않습니다'
  }
  return null
}

export function useSunlightPipeline({ apiUrl: _apiUrl }: UseSunlightPipelineOptions): UseSunlightPipelineReturn {
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
  const [windowPoints, setWindowPoints] = useState<Array<{ id: string; x: number; y: number; z: number; name: string; group: string }>>([])

  // Restore model info on mount when session is being resumed
  useEffect(() => {
    if (base.phase === 'polling' && base.sessionId && !sceneUrl) {
      const info = restoreModelInfo()
      if (info) {
        setModelId(info.modelId)
        setSceneUrl(info.sceneUrl)
        setModelMeta(info.modelMeta)
        logger.info('Model info restored from session', { modelId: info.modelId })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base.phase, base.sessionId])

  const reset = useCallback(() => {
    base.reset()
    setModelId(null)
    setSceneUrl(null)
    setModelMeta(null)
    setImportData(null)
    setWindowPoints([])
    clearModelInfo()
  }, [base])

  const uploadFile = useCallback(async (objFile: File, mtlFile?: File) => {
    base.setPhase('uploading')
    base.setError(null)
    setImportData(null)
    setWindowPoints([])

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
        const fullSceneUrl = `${contextApiUrl}${sn5fData.sceneUrl}`
        setSceneUrl(fullSceneUrl)
        persistModelInfo({ sceneUrl: fullSceneUrl, modelId: sn5fData.modelId, modelMeta: null })
        base.setPhase('idle')
        logger.info('SN5F import success', { sessionId: sn5fData.sessionId, groups: groups.length })
        return
      }

      // ── OBJ: POST /import/obj ──
      if (ext === 'obj') {
        const formData = new FormData()
        formData.append('file', objFile)
        if (mtlFile) {
          formData.append('mtl_file', mtlFile)
        }

        const importDataRes = await api.postFormData('/import/obj', formData)
        setModelId(importDataRes.model_id)
        const fullSceneUrl = `${contextApiUrl}${importDataRes.scene_url}`
        setSceneUrl(fullSceneUrl)

        // BUG-2 fix: OBJ 응답으로 modelMeta 설정
        const meta: ModelMetadata = {
          model_id: importDataRes.model_id,
          scene_url: importDataRes.scene_url,
          original_name: objFile.name,
          format: 'glb',
          vertices: importDataRes.vertices ?? 0,
          faces: importDataRes.faces ?? 0,
          bounds_min: [0, 0, 0],
          bounds_max: [0, 0, 0],
        }
        setModelMeta(meta)
        persistModelInfo({ sceneUrl: fullSceneUrl, modelId: importDataRes.model_id, modelMeta: meta })

        // 백엔드에서 추출한 그룹별 색상 사용 (없으면 팔레트 fallback)
        const colorMap = new Map<string, string>()
        if (Array.isArray(importDataRes.group_colors)) {
          for (const gc of importDataRes.group_colors) {
            if (gc.color) colorMap.set(gc.name, gc.color)
          }
        }

        // 창문 자동 측정점
        if (Array.isArray(importDataRes.window_points) && importDataRes.window_points.length > 0) {
          setWindowPoints(importDataRes.window_points)
          logger.info('Window points detected', { count: importDataRes.window_points.length })
        }

        // BUG-3 fix: OBJ 응답의 groups로 importData 설정
        const rawGroups = Array.isArray(importDataRes.groups) ? importDataRes.groups : []
        const groups: BuildingGroupInfo[] = (rawGroups as string[]).map((name: string, i: number) => ({
          name,
          vertexCount: 0,
          faceCount: 0,
          color: colorMap.get(name) || GROUP_COLORS[i % GROUP_COLORS.length],
          visible: true,
        }))
        if (groups.length > 0) {
          setImportData({
            sessionId: '',
            modelId: importDataRes.model_id,
            sceneUrl: importDataRes.scene_url,
            groups,
            conditions: null,
            measurementGroups: [],
            layers: [],
          })
        }

        // /import/obj의 model_id로 세션 등록 (파일 재전송 없음)
        const analysisData: SunlightUploadResponse = await api.post(
          `/sunlight/register?model_id=${importDataRes.model_id}`
        )
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
    windowPoints,
    uploadFile,
    runAnalysis,
    cancelAnalysis: base.cancelAnalysis,
    reset,
  }
}
