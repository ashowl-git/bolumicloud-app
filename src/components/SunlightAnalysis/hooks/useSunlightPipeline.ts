import { useState, useRef, useEffect, useCallback } from 'react'
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
  const [modelId, setModelId] = useState<string | null>(null)
  const [sceneUrl, setSceneUrl] = useState<string | null>(null)
  const [modelMeta, setModelMeta] = useState<ModelMetadata | null>(null)
  const [progress, setProgress] = useState<SunlightProgress | null>(null)
  const [results, setResults] = useState<SunlightAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCancelled, setIsCancelled] = useState(false)
  const [estimatedRemainingSec, setEstimatedRemainingSec] = useState<number | null>(null)
  const [importData, setImportData] = useState<Sn5fImportData | null>(null)

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
    setModelId(null)
    setSceneUrl(null)
    setModelMeta(null)
    setProgress(null)
    setResults(null)
    setError(null)
    setIsCancelled(false)
    setEstimatedRemainingSec(null)
    setImportData(null)
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
            const resultsData = await resultsRes.json()
            // 결과 데이터 기본 검증
            if (!resultsData || !resultsData.points || !Array.isArray(resultsData.points)) {
              setError('분석 결과 형식이 올바르지 않습니다')
              setPhase('error')
              clearSession()
            } else {
              setResults(resultsData as SunlightAnalysisResult)
              setPhase('completed')
              setEstimatedRemainingSec(null)
              clearSession()
            }
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
    setImportData(null)

    const ext = objFile.name.split('.').pop()?.toLowerCase()

    try {
      // ── SN5F 경로: POST /import/sn5f ──
      if (ext === 'sn5f') {
        const formData = new FormData()
        formData.append('file', objFile)

        const res = await fetch(`${apiUrl}/import/sn5f`, {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: 'SN5F 업로드 실패' }))
          throw new Error(errData.detail || 'SN5F 파일 업로드 실패')
        }

        const data = await res.json()

        // 그룹 변환 (string[] -> BuildingGroupInfo[])
        const GROUP_COLORS = [
          '#7CB9E8', '#B284BE', '#72BF6A', '#F0A868', '#E8747C',
          '#6ECFCF', '#D4A76A', '#9B9B9B', '#A8D8B9', '#C4B5E0',
        ]

        const rawGroups = Array.isArray(data.groups) ? data.groups : []
        const groups: BuildingGroupInfo[] = (rawGroups as string[]).map((name: string, i: number) => ({
          name,
          vertexCount: 0,
          faceCount: 0,
          color: GROUP_COLORS[i % GROUP_COLORS.length],
          visible: true,
        }))

        // 조건 변환 (snake_case -> camelCase)
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

        // 측정점 그룹 변환
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
        setSessionId(sn5fData.sessionId)
        setModelId(sn5fData.modelId)
        setSceneUrl(`${apiUrl}${sn5fData.sceneUrl}`)
        setPhase('idle')
        logger.info('SN5F import success', { sessionId: sn5fData.sessionId, groups: groups.length })
        return
      }

      // ── OBJ 경로 (import API 사용): POST /import/obj ──
      if (ext === 'obj') {
        const formData = new FormData()
        formData.append('file', objFile)

        // 1) 그룹 보존 임포트
        const importRes = await fetch(`${apiUrl}/import/obj`, {
          method: 'POST',
          body: formData,
        })

        if (!importRes.ok) {
          const errData = await importRes.json().catch(() => ({ detail: 'OBJ 임포트 실패' }))
          throw new Error(errData.detail || 'OBJ 파일 임포트 실패')
        }

        const importData = await importRes.json()
        setModelId(importData.model_id)
        setSceneUrl(`${apiUrl}${importData.scene_url}`)

        // 2) 기존 sunlight 업로드 (분석 엔진용)
        const analysisFormData = new FormData()
        analysisFormData.append('obj_file', objFile)

        const analysisRes = await fetch(`${apiUrl}/sunlight/upload`, {
          method: 'POST',
          body: analysisFormData,
        })

        if (!analysisRes.ok) {
          const errData = await analysisRes.json().catch(() => ({ detail: '업로드 실패' }))
          throw new Error(errData.detail || '분석용 업로드 실패')
        }

        const analysisData: SunlightUploadResponse = await analysisRes.json()
        setSessionId(analysisData.session_id)

        setPhase('idle')
        logger.info('OBJ import success', { sessionId: analysisData.session_id, modelId: importData.model_id })
        return
      }

      // ── 기존 폴백 경로 (확장자 불명) ──
      // 1) 기존 sunlight 업로드 (분석 엔진용)
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

      // 2) 3D 모델 업로드 (GLB 변환 + 뷰어용)
      const modelFormData = new FormData()
      modelFormData.append('file', objFile)

      const modelRes = await fetch(`${apiUrl}/models/upload`, {
        method: 'POST',
        body: modelFormData,
      })

      if (modelRes.ok) {
        const modelData: ModelMetadata = await modelRes.json()
        setModelId(modelData.model_id)
        setSceneUrl(`${apiUrl}${modelData.scene_url}`)
        setModelMeta(modelData)
        logger.info('Model upload success', { modelId: modelData.model_id })
      } else {
        // 3D 프리뷰 실패는 분석을 중단하지 않음
        logger.warn('Model upload failed, 3D preview unavailable')
      }

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
    modelId,
    sceneUrl,
    modelMeta,
    progress,
    results,
    error,
    isCancelled,
    estimatedRemainingSec,
    importData,
    uploadFile,
    runAnalysis,
    cancelAnalysis,
    reset,
  }
}
