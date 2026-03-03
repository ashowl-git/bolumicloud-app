'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Settings, Loader2, BarChart3, CheckCircle2, CloudUpload } from 'lucide-react'
import { useSunlightPipelineContext } from '@/contexts/SunlightPipelineContext'
import { useApi } from '@/contexts/ApiContext'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { SUNLIGHT_STAGE_LABELS, SUNLIGHT_DATE_PRESETS } from '@/lib/types/sunlight'
import type { SunlightConfig, SunlightConfigState } from '@/lib/types/sunlight'
import type { SunlightProgress as SunlightProgressType } from '@/lib/types/sunlight'
import type { LocalizedText } from '@/lib/types/i18n'

import SunlightConfigPanel from './SunlightConfigPanel'
import SunlightResults from './SunlightResults'
import ModelLoadingSkeleton from '@/components/common/ModelLoadingSkeleton'

// 3D 뷰어 (dynamic import for SSR safety)
import dynamic from 'next/dynamic'
const ThreeViewer = dynamic(() => import('@/components/shared/3d/ThreeViewer'), { ssr: false })
const BuildingModel = dynamic(() => import('@/components/shared/3d/BuildingModel'), { ssr: false }) // Step 1, 4 프리뷰용
const GroundGrid = dynamic(() => import('@/components/shared/3d/GroundGrid'), { ssr: false })
const CompassRose = dynamic(() => import('@/components/shared/3d/CompassRose'), { ssr: false })
const SceneLighting = dynamic(() => import('@/components/shared/3d/SceneLighting'), { ssr: false })
import CameraPresetBar from '@/components/shared/3d/CameraPresetBar'
import { useModelLoader } from '@/components/shared/3d/useModelLoader'
import type { CameraPresetId, ModelConfig } from '@/components/shared/3d/types'

// Shadow animation (Phase 2)
import ShadowAnimationPlayer from './3d/ShadowAnimationPlayer'
import { useShadowAnimation } from './hooks/useShadowAnimation'

// Measurement tools (Phase 3) — 인터랙션 레이어
import { usePointPlacement } from '@/components/shared/3d/interaction/usePointPlacement'
import { useAreaPlacement } from '@/components/shared/3d/interaction/useAreaPlacement'
import InteractionToolbar from '@/components/shared/3d/interaction/InteractionToolbar'
const InteractiveBuildingModel = dynamic(() => import('@/components/shared/3d/interaction/InteractiveBuildingModel'), { ssr: false })
const InteractiveGround = dynamic(() => import('@/components/shared/3d/interaction/InteractiveGround'), { ssr: false })
const SurfaceHighlight = dynamic(() => import('@/components/shared/3d/interaction/SurfaceHighlight'), { ssr: false })
const PointMarker3D = dynamic(() => import('@/components/shared/3d/interaction/PointMarker3D'), { ssr: false })
const AreaGridPreview = dynamic(() => import('@/components/shared/3d/interaction/AreaGridPreview'), { ssr: false })

// 기존 결과 표시용 (Step 4)
import SunlightLegend from './3d/SunlightLegend'
const SunlightHeatmapOverlay = dynamic(() => import('./3d/SunlightHeatmapOverlay'), { ssr: false })

// Reports + Cause analysis (Phase 4)
import type { CauseAnalysisResult } from '@/lib/types/sunlight'
import ReportDownloadPanel from './ReportDownloadPanel'
import CauseAnalysisView from './CauseAnalysisView'
const ViolationHighlight = dynamic(() => import('./3d/ViolationHighlight'), { ssr: false })

// ─── 텍스트 ─────────────────────────────────

const txt = {
  uploadBtn: { ko: 'OBJ 파일 업로드', en: 'Upload OBJ File' } as LocalizedText,
  uploading: { ko: '업로드 중...', en: 'Uploading...' } as LocalizedText,
  continue: { ko: '다음', en: 'Continue' } as LocalizedText,
  back: { ko: '이전', en: 'Back' } as LocalizedText,
  startAnalysis: { ko: '분석 시작', en: 'Start Analysis' } as LocalizedText,
  running: { ko: '분석 중...', en: 'Analyzing...' } as LocalizedText,
  reset: { ko: '새로 시작', en: 'Reset' } as LocalizedText,
  cancel: { ko: '분석 취소', en: 'Cancel Analysis' } as LocalizedText,
  cancelled: { ko: '분석이 취소되었습니다', en: 'Analysis cancelled' } as LocalizedText,
  backToSettings: { ko: '설정 변경', en: 'Change Settings' } as LocalizedText,
  dropzone: { ko: 'OBJ 파일을 드래그하거나 클릭하세요', en: 'Drag or click to upload OBJ file' } as LocalizedText,
  dropzoneHint: { ko: '.obj 파일 (최대 100MB)', en: '.obj file (max 100MB)' } as LocalizedText,
  elapsed: { ko: '경과', en: 'Elapsed' } as LocalizedText,
  overall: { ko: '전체', en: 'Overall' } as LocalizedText,
  current: { ko: '현재:', en: 'Current:' } as LocalizedText,
}

// ─── Step 정의 ─────────────────────────────

const STEPS = [
  { label: 'Upload', icon: Upload },
  { label: 'Settings', icon: Settings },
  { label: 'Progress', icon: Loader2 },
  { label: 'Results', icon: BarChart3 },
]

// ─── 기본 설정 ─────────────────────────────

const DEFAULT_CONFIG: SunlightConfigState = {
  latitude: 37.5665,
  longitude: 126.978,
  timezone: 135,
  azimuth: 0,
  date: SUNLIGHT_DATE_PRESETS[0], // 동지
  buildingType: 'apartment',
  resolution: 'legal',
  solarTimeMode: 'true_solar',
  totalThreshold: { startHour: 8, endHour: 16, requiredHours: 4 },
  continuousThreshold: { startHour: 9, endHour: 15, requiredHours: 2 },
}

const fadeVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

// ─── 유틸 ─────────────────────────────────

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec.toFixed(1)}s`
  const min = Math.floor(sec / 60)
  const remaining = (sec % 60).toFixed(0)
  return `${min}m ${remaining}s`
}

function formatEta(sec: number): string {
  const minutes = Math.floor(sec / 60)
  const seconds = sec % 60
  if (minutes > 0) return `${minutes}분 ${seconds}초`
  return `${seconds}초`
}

// ─── 컴포넌트 ─────────────────────────────

export default function SunlightPipelineTab() {
  const { t } = useLocalizedText()
  const { apiUrl } = useApi()
  const {
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
  } = useSunlightPipelineContext()

  // Step state
  const [currentStep, setCurrentStep] = useState(1)

  // File state
  const [objFile, setObjFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Config state
  const [config, setConfig] = useState<SunlightConfigState>({ ...DEFAULT_CONFIG })

  // 3D viewer state
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('perspective')
  const modelConfig: ModelConfig | null = sceneUrl
    ? { url: sceneUrl, format: 'glb', autoCenter: true, zUp: false }
    : null
  const { state: modelState, scene: modelScene, bbox: modelBbox } = useModelLoader(modelConfig)

  // Shadow animation
  const shadow = useShadowAnimation({ apiUrl })

  // Measurement placement (인터랙션 레이어)
  const placement = usePointPlacement({ prefix: 'P' })
  const areaPlacement = useAreaPlacement('G')

  // Cause analysis (Phase 4)
  const [causeResult, setCauseResult] = useState<CauseAnalysisResult | null>(null)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)

  // 분석 완료 시 그림자 자동 계산
  useEffect(() => {
    if (phase === 'completed' && results && sessionId && shadow.frames.length === 0 && !shadow.isComputing) {
      shadow.computeShadows({
        sessionId,
        latitude: config.latitude,
        longitude: config.longitude,
        month: config.date.month,
        day: config.date.day,
        timezoneOffset: config.timezone / 15,
        stepMinutes: 10,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, results, sessionId])

  // Auto-transition based on phase
  useEffect(() => {
    if (phase === 'idle' && sessionId && currentStep === 1) {
      setCurrentStep(2)
    }
  }, [phase, sessionId, currentStep])

  useEffect(() => {
    if (phase === 'polling' || phase === 'running') {
      setCurrentStep(3)
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'completed' && results) {
      setCurrentStep(4)
      setTimeout(() => {
        const el = document.getElementById('sunlight-results-section')
        el?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  }, [phase, results])

  // Browser tab title
  useEffect(() => {
    if (phase === 'polling' && progress) {
      document.title = `[${progress.overall_progress}%] 일조 분석 - BoLumiCloud`
    } else if (phase === 'completed') {
      document.title = '[완료] 일조 분석 - BoLumiCloud'
    } else {
      document.title = '일조 분석 - BoLumiCloud'
    }
    return () => { document.title = 'BoLumiCloud' }
  }, [phase, progress])

  // Completed steps
  const getCompletedSteps = (): number[] => {
    const steps: number[] = []
    if (sessionId) steps.push(1)
    if (currentStep > 2) steps.push(2)
    if (phase === 'completed') steps.push(3)
    return steps
  }

  // Handlers
  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      const obj = files.find((f) => f.name.toLowerCase().endsWith('.obj'))
      if (obj) setObjFile(obj)
    },
    []
  )

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    const obj = files.find((f) => f.name.toLowerCase().endsWith('.obj'))
    if (obj) setObjFile(obj)
    e.target.value = ''
  }, [])

  const handleUpload = useCallback(async () => {
    if (!objFile) return
    await uploadFile(objFile)
  }, [objFile, uploadFile])

  const handleStartAnalysis = useCallback(async () => {
    // BaseAnalysisPoint -> MeasurementPoint (API 형식)
    const measurementPoints = placement.points.map((p) => ({
      id: p.id,
      x: p.position.x,
      y: p.position.y,
      z: p.position.z,
      name: p.name,
    }))

    const analysisConfig: SunlightConfig = {
      latitude: config.latitude,
      longitude: config.longitude,
      timezone_offset: config.timezone / 15,
      standard_meridian: config.timezone,
      azimuth: config.azimuth,
      month: config.date.month,
      day: config.date.day,
      date_label: config.date.label,
      building_type: config.buildingType,
      time_start: `${String(config.totalThreshold.startHour).padStart(2, '0')}:00`,
      time_end: `${String(config.totalThreshold.endHour).padStart(2, '0')}:00`,
      continuous_start: `${String(config.continuousThreshold.startHour).padStart(2, '0')}:00`,
      continuous_end: `${String(config.continuousThreshold.endHour).padStart(2, '0')}:00`,
      total_required_hours: config.totalThreshold.requiredHours,
      continuous_required_hours: config.continuousThreshold.requiredHours,
      resolution: config.resolution,
      solar_time_mode: config.solarTimeMode,
      measurement_points: measurementPoints,
    }
    await runAnalysis(analysisConfig)
  }, [config, runAnalysis, placement.points])

  const handleReset = useCallback(() => {
    reset()
    setCurrentStep(1)
    setObjFile(null)
    setConfig({ ...DEFAULT_CONFIG })
    placement.clearPoints()
    areaPlacement.resetArea()
    setCauseResult(null)
    setSelectedBuildingId(null)
  }, [reset, placement, areaPlacement])

  const handleConfigChange = useCallback((partial: Partial<SunlightConfigState>) => {
    setConfig((prev) => ({ ...prev, ...partial }))
  }, [])

  const isUploading = phase === 'uploading'
  const isRunning = phase === 'running' || phase === 'polling'
  const canUpload = !!objFile && !isUploading

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div />
        <div className="flex gap-2">
          {currentStep === 4 && sessionId && (
            <button
              onClick={() => { setCurrentStep(2) }}
              className="border border-gray-200 hover:border-gray-400 px-4 py-3
                text-sm text-gray-700 hover:text-gray-900 transition-all duration-300"
            >
              {t(txt.backToSettings)}
            </button>
          )}
          {currentStep > 1 && (
            <button
              onClick={handleReset}
              className="border border-gray-200 hover:border-red-600/30 px-4 py-3
                text-sm text-gray-900 hover:text-red-600 transition-all duration-300"
            >
              {t(txt.reset)}
            </button>
          )}
        </div>
      </div>

      {/* Step Indicator (4 steps) */}
      <div className="flex items-center justify-center mb-10">
        {STEPS.map((step, idx) => {
          const stepNum = idx + 1
          const isCompleted = getCompletedSteps().includes(stepNum)
          const isActive = stepNum === currentStep
          const Icon = step.icon

          return (
            <div key={stepNum} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-green-600 text-white'
                      : isActive
                      ? 'border-2 border-red-600 text-red-600 ring-2 ring-red-600/20'
                      : 'border border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={18} strokeWidth={2} />
                  ) : (
                    <Icon size={16} strokeWidth={1.5} />
                  )}
                </div>
                <span
                  className={`text-xs mt-1.5 ${
                    isActive ? 'text-red-600 font-medium' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`w-12 sm:w-20 h-0.5 mx-1 transition-all duration-300 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Cancel Banner */}
      {isCancelled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-amber-200 bg-amber-50 p-4"
        >
          <p className="text-sm text-amber-700">{t(txt.cancelled)}</p>
          <button
            onClick={handleReset}
            className="mt-2 text-xs text-amber-600 hover:text-amber-800 underline"
          >
            처음부터 다시 시작
          </button>
        </motion.div>
      )}

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-red-200 bg-red-50 p-4"
        >
          <p className="text-sm text-red-600">{error}</p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={handleReset}
              className="text-xs text-red-500 hover:text-red-700 underline"
            >
              {t(txt.reset)}
            </button>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* ========== Step 1: Upload ========== */}
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                if (!isUploading && !sessionId) setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => !isUploading && !sessionId && inputRef.current?.click()}
              className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
                isUploading || sessionId
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  : isDragging
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-300 hover:border-red-600/30'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".obj"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading || !!sessionId}
              />
              {isUploading ? (
                <div className="space-y-2">
                  <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-gray-600">{t(txt.uploading)}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <CloudUpload size={32} strokeWidth={1.5} className="mx-auto text-gray-400" />
                  <p className="text-sm text-gray-700">{t(txt.dropzone)}</p>
                  <p className="text-xs text-gray-400">{t(txt.dropzoneHint)}</p>
                </div>
              )}
            </div>

            {/* Selected File */}
            {objFile && (
              <div className="border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">{objFile.name}</p>
                  <p className="text-xs text-gray-400">
                    {(objFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                {!sessionId && (
                  <button
                    onClick={() => setObjFile(null)}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    제거
                  </button>
                )}
              </div>
            )}

            {/* Upload Button */}
            {canUpload && !sessionId && (
              <div className="pt-2">
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="border border-gray-200 hover:border-red-600/30 px-8 py-3
                    text-gray-900 hover:text-red-600 transition-all duration-300
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? t(txt.uploading) : t(txt.uploadBtn)}
                </button>
              </div>
            )}

            {/* 3D Preview after upload */}
            {sessionId && modelState === 'loaded' && modelScene && (
              <div className="border border-gray-200 relative">
                <ThreeViewer bbox={modelBbox} height="360px">
                  <SceneLighting />
                  <BuildingModel scene={modelScene} bbox={modelBbox} />
                  <GroundGrid bbox={modelBbox} />
                  <CompassRose bbox={modelBbox} />
                </ThreeViewer>
                <CameraPresetBar
                  bbox={modelBbox}
                  activePreset={cameraPreset}
                  onPresetChange={setCameraPreset}
                />
                {modelMeta && (
                  <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      V: {modelMeta.vertices.toLocaleString()} | F: {modelMeta.faces.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400">{modelMeta.original_name}</span>
                  </div>
                )}
              </div>
            )}
            {sessionId && modelState === 'loading' && (
              <ModelLoadingSkeleton height="360px" message="3D 모델 변환 중..." />
            )}

            {/* Continue to Settings */}
            {sessionId && (
              <div className="pt-2">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="border border-gray-200 hover:border-red-600/30 px-8 py-3
                    text-gray-900 hover:text-red-600 transition-all duration-300"
                >
                  {t(txt.continue)}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ========== Step 2: Settings + 3D Preview ========== */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            <div className={`${modelScene ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : ''}`}>
              {/* 설정 패널 */}
              <div className="space-y-6">
                <SunlightConfigPanel
                  config={config}
                  onChange={handleConfigChange}
                  disabled={isRunning}
                />
              </div>

              {/* 3D 프리뷰 + 측정점 배치 (인터랙션 레이어) */}
              {modelScene && (
                <div className="border border-gray-200 relative">
                  <InteractionToolbar
                    analysisType="sunlight"
                    mode={placement.mode}
                    pointCount={placement.points.length}
                    onModeChange={(m) => {
                      placement.setMode(m)
                      if (m !== 'place_area') areaPlacement.resetArea()
                    }}
                    onClearAll={() => {
                      placement.clearPoints()
                      areaPlacement.resetArea()
                    }}
                  />
                  <ThreeViewer
                    bbox={modelBbox}
                    height="400px"
                    orbitEnabled={placement.mode === 'navigate'}
                  >
                    <SceneLighting />
                    <InteractiveBuildingModel
                      scene={modelScene}
                      bbox={modelBbox}
                      interactionEnabled={placement.mode === 'place_point'}
                      onSurfaceHover={placement.setHoverHit}
                      onSurfaceClick={placement.handleSurfaceClick}
                    />
                    <InteractiveGround
                      bbox={modelBbox}
                      enabled={placement.mode === 'place_point' || placement.mode === 'place_area'}
                      onGroundHover={(hit) => {
                        if (placement.mode === 'place_area') areaPlacement.handleAreaHover(hit)
                        else placement.setHoverHit(hit)
                      }}
                      onGroundClick={(hit) => {
                        if (placement.mode === 'place_area') areaPlacement.handleAreaClick(hit)
                        else placement.handleSurfaceClick(hit)
                      }}
                    />
                    <GroundGrid bbox={modelBbox} />
                    <CompassRose bbox={modelBbox} />
                    {placement.mode !== 'place_area' && (
                      <SurfaceHighlight hit={placement.hoverHit} />
                    )}
                    {/* 영역 격자 프리뷰 */}
                    <AreaGridPreview
                      firstCorner={areaPlacement.firstCorner}
                      previewCorner={areaPlacement.previewCorner}
                      area={areaPlacement.area}
                      gridSpacing={areaPlacement.gridSpacing}
                      gridPointCount={areaPlacement.gridPoints.length}
                    />
                    {/* 개별 포인트 마커 */}
                    {placement.points.map((point) => (
                      <PointMarker3D
                        key={point.id}
                        point={point}
                        visualType={point.surfaceType === 'ground' ? 'sphere' : 'disc'}
                        isSelected={point.id === placement.selectedPointId}
                        color={point.surfaceType === 'ground' ? '#ffffff' : '#60a5fa'}
                        onClick={() => placement.handlePointClick(point.id)}
                      />
                    ))}
                  </ThreeViewer>
                  <CameraPresetBar
                    bbox={modelBbox}
                    activePreset={cameraPreset}
                    onPresetChange={setCameraPreset}
                  />
                  {/* 영역 격자 컨트롤 (영역 확정 후) */}
                  {areaPlacement.area && (
                    <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-3">
                      <span className="text-xs text-gray-500">격자 간격</span>
                      <input
                        type="number"
                        min={0.5}
                        max={20}
                        step={0.5}
                        value={areaPlacement.gridSpacing}
                        onChange={(e) => areaPlacement.setGridSpacing(Number(e.target.value))}
                        className="w-16 border border-gray-200 px-2 py-0.5 text-xs text-center"
                      />
                      <span className="text-xs text-gray-400">m</span>
                      <button
                        onClick={() => {
                          const pts = areaPlacement.generateGrid()
                          placement.setPoints([...placement.points, ...pts])
                          areaPlacement.resetArea()
                          placement.setMode('navigate')
                        }}
                        className="text-xs text-red-600 hover:text-red-800 border border-red-200 px-2 py-0.5"
                      >
                        격자 생성
                      </button>
                      <button
                        onClick={() => areaPlacement.resetArea()}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        취소
                      </button>
                    </div>
                  )}
                  {/* 포인트 수 표시 */}
                  {placement.points.length > 0 && !areaPlacement.area && (
                    <div className="px-4 py-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        {placement.points.length}개 측정점 배치됨
                        {placement.mode === 'place_point' && ' — 지면 또는 건물 표면을 클릭하여 추가'}
                        {placement.mode === 'place_area' && (areaPlacement.firstCorner
                          ? ' — 두 번째 모서리를 클릭하여 영역 확정'
                          : ' — 지면을 클릭하여 영역의 첫 모서리 지정'
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Start Button */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentStep(1)}
                className="border border-gray-200 hover:border-gray-400 px-6 py-3
                  text-sm text-gray-700 hover:text-gray-900 transition-all duration-300"
              >
                {t(txt.back)}
              </button>
              <button
                onClick={handleStartAnalysis}
                disabled={isRunning}
                className="border border-gray-200 hover:border-red-600/30 px-8 py-3
                  text-gray-900 hover:text-red-600 transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? t(txt.running) : t(txt.startAnalysis)}
              </button>
            </div>
          </motion.div>
        )}

        {/* ========== Step 3: Progress ========== */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
          >
            {progress && (
              <SunlightProgressView progress={progress} estimatedRemainingSec={estimatedRemainingSec} />
            )}
            {!progress && isRunning && (
              <div className="border border-gray-200 p-8 text-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">{t(txt.running)}</p>
              </div>
            )}
            {isRunning && (
              <div className="pt-4">
                <button
                  onClick={cancelAnalysis}
                  className="border border-gray-200 hover:border-red-600/30 px-6 py-3
                    text-sm text-gray-700 hover:text-red-600 transition-all duration-300"
                >
                  {t(txt.cancel)}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ========== Step 4: Results + Shadow Visualization ========== */}
        {currentStep === 4 && results && (
          <motion.div
            key="step-4"
            id="sunlight-results-section"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* 그림자 3D 시각화 + 측정점 히트맵 */}
            {modelScene && shadow.frames.length > 0 && (
              <div className="relative">
                <ShadowAnimationPlayer
                  modelScene={modelScene}
                  modelBbox={modelBbox}
                  currentFrame={shadow.currentFrame}
                  playback={shadow.playback}
                  maxMinute={shadow.frames.length > 0 ? shadow.frames[shadow.frames.length - 1].minute : 479}
                  stepSize={shadow.frames.length > 1 ? shadow.frames[1].minute - shadow.frames[0].minute : 10}
                  onMinuteChange={shadow.setCurrentMinute}
                  onPlay={shadow.play}
                  onPause={shadow.pause}
                  onSpeedChange={shadow.setSpeed}
                >
                  {results.points.length > 0 && (
                    <SunlightHeatmapOverlay
                      points={placement.points.length > 0
                        ? placement.points.map((p) => ({ id: p.id, x: p.position.x, y: p.position.y, z: p.position.z, name: p.name }))
                        : results.points.map((p) => ({ id: p.id, x: p.x, y: p.y, z: p.z, name: p.name }))
                      }
                      results={results.points}
                      selectedPointId={placement.selectedPointId}
                      onPointClick={placement.selectPoint}
                    />
                  )}
                  {causeResult && causeResult.point_causes.length > 0 && (
                    <ViolationHighlight
                      blockers={causeResult.point_causes.flatMap((pc) => pc.blockers)}
                      selectedBuildingId={selectedBuildingId}
                    />
                  )}
                </ShadowAnimationPlayer>
                {results.points.length > 0 && <SunlightLegend />}
              </div>
            )}
            {shadow.isComputing && (
              <div className="border border-gray-200 p-6 text-center" aria-live="polite">
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500">
                  그림자 계산 중... {shadow.computeProgress.toFixed(0)}%
                </p>
                <div
                  className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden mx-auto mt-2"
                  role="progressbar"
                  aria-valuenow={Math.round(shadow.computeProgress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Shadow computation progress"
                >
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${shadow.computeProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 보고서 생성 + 다운로드 (Phase 4) */}
            {sessionId && (
              <ReportDownloadPanel
                sessionId={sessionId}
                results={results}
                config={config}
                onCauseAnalysis={setCauseResult}
              />
            )}

            {/* 분석 결과 테이블 */}
            <SunlightResults
              results={results}
              selectedPointId={placement.selectedPointId}
              onPointSelect={placement.selectPoint}
            />

            {/* 원인 분석 (Phase 4) */}
            {causeResult && causeResult.total_non_compliant > 0 && (
              <CauseAnalysisView
                causeResult={causeResult}
                selectedBuildingId={selectedBuildingId}
                onBuildingSelect={setSelectedBuildingId}
              />
            )}

            {/* Bottom Navigation */}
            <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
              <button
                onClick={() => setCurrentStep(2)}
                className="border border-red-600/30 hover:bg-red-50 px-6 py-3
                  text-sm text-red-600 hover:text-red-700 transition-all duration-300"
              >
                측정점 수정 후 재분석
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                className="border border-gray-200 hover:border-gray-400 px-6 py-3
                  text-sm text-gray-700 hover:text-gray-900 transition-all duration-300"
              >
                {t(txt.backToSettings)}
              </button>
              <button
                onClick={handleReset}
                className="border border-gray-200 hover:border-red-600/30 px-6 py-3
                  text-sm text-gray-900 hover:text-red-600 transition-all duration-300"
              >
                {t(txt.reset)}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── 진행률 서브 컴포넌트 ─────────────────────

function SunlightProgressView({
  progress,
  estimatedRemainingSec,
}: {
  progress: SunlightProgressType
  estimatedRemainingSec: number | null
}) {
  const { t } = useLocalizedText()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 p-6"
      aria-live="polite"
    >
      {/* Stage Checklist */}
      <div className="space-y-3 mb-6">
        {progress.stages.map((stage, idx) => {
          const label = SUNLIGHT_STAGE_LABELS[stage.name]
          const stageLabel = label ? t(label) : stage.name

          return (
            <div key={stage.name} className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                {stage.status === 'completed' ? (
                  <CheckCircle2 size={18} className="text-green-600" />
                ) : stage.status === 'processing' ? (
                  <Loader2 size={18} className="text-blue-600 animate-spin" />
                ) : stage.status === 'error' ? (
                  <div className="w-4 h-4 rounded-full bg-red-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${
                      stage.status === 'completed'
                        ? 'text-gray-700'
                        : stage.status === 'processing'
                        ? 'text-blue-700 font-medium'
                        : stage.status === 'error'
                        ? 'text-red-700'
                        : 'text-gray-400'
                    }`}
                  >
                    {idx + 1}. {stageLabel}
                  </span>
                  {stage.duration_sec !== null && (
                    <span className="text-xs text-gray-400">({stage.duration_sec.toFixed(1)}s)</span>
                  )}
                </div>

                {stage.status === 'processing' && progress.stage_progress.total > 0 && (
                  <div className="mt-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={progress.stage_progress.completed}
                        aria-valuemin={0}
                        aria-valuemax={progress.stage_progress.total}
                        aria-label={`${stageLabel} progress`}
                      >
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${(progress.stage_progress.completed / progress.stage_progress.total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums">
                        {progress.stage_progress.completed}/{progress.stage_progress.total}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Overall Progress Bar */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">{t(txt.overall)}</span>
          <span className="text-sm text-gray-600 tabular-nums">
            {progress.overall_progress}% ({formatDuration(progress.elapsed_sec)})
            {estimatedRemainingSec !== null && estimatedRemainingSec > 0 && (
              <> | 남은 시간 약 {formatEta(estimatedRemainingSec)}</>
            )}
            {estimatedRemainingSec === null && progress.overall_progress < 5 && progress.status === 'processing' && (
              <> | 계산 중...</>
            )}
          </span>
        </div>
        <div
          className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={progress.overall_progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t(txt.overall)}
        >
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700"
            style={{ width: `${progress.overall_progress}%` }}
          />
        </div>
      </div>
    </motion.div>
  )
}
