'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Settings, Loader2, BarChart3, CheckCircle2, CloudUpload } from 'lucide-react'
import { useViewPipelineContext } from '@/contexts/ViewPipelineContext'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { VIEW_STAGE_LABELS } from '@/lib/types/view'
import type { ViewConfig, ViewConfigState, ViewObserverPoint } from '@/lib/types/view'
import type { ViewProgress as ViewProgressType } from '@/lib/types/view'
import type { LocalizedText } from '@/lib/types/i18n'

import ViewConfigPanel from './ViewConfigPanel'
import ViewResults from './ViewResults'

// 3D 뷰어 (dynamic import for SSR safety)
import dynamic from 'next/dynamic'
const ThreeViewer = dynamic(() => import('@/components/shared/3d/ThreeViewer'), { ssr: false })
const BuildingModel = dynamic(() => import('@/components/shared/3d/BuildingModel'), { ssr: false })
const GroundGrid = dynamic(() => import('@/components/shared/3d/GroundGrid'), { ssr: false })
const CompassRose = dynamic(() => import('@/components/shared/3d/CompassRose'), { ssr: false })
const SceneLighting = dynamic(() => import('@/components/shared/3d/SceneLighting'), { ssr: false })
import CameraPresetBar from '@/components/shared/3d/CameraPresetBar'
import { useModelLoader } from '@/components/shared/3d/useModelLoader'
import type { CameraPresetId, ModelConfig } from '@/components/shared/3d/types'

// 인터랙션 레이어 (공유 컴포넌트)
import { usePointPlacement } from '@/components/shared/3d/interaction/usePointPlacement'
import InteractionToolbar from '@/components/shared/3d/interaction/InteractionToolbar'
const InteractiveBuildingModel = dynamic(() => import('@/components/shared/3d/interaction/InteractiveBuildingModel'), { ssr: false })
const SurfaceHighlight = dynamic(() => import('@/components/shared/3d/interaction/SurfaceHighlight'), { ssr: false })
const PointMarker3D = dynamic(() => import('@/components/shared/3d/interaction/PointMarker3D'), { ssr: false })

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
  overall: { ko: '전체', en: 'Overall' } as LocalizedText,
}

const STEPS = [
  { label: 'Upload', icon: Upload },
  { label: 'Settings', icon: Settings },
  { label: 'Progress', icon: Loader2 },
  { label: 'Results', icon: BarChart3 },
]

const DEFAULT_CONFIG: ViewConfigState = {
  latitude: 37.5665,
  longitude: 126.978,
  timezone: 135,
  hemisphereResolution: 180,
  projectionType: 'equal_solid_angle',
}

const fadeVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

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

export default function ViewPipelineTab() {
  const { t } = useLocalizedText()
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
  } = useViewPipelineContext()

  const [currentStep, setCurrentStep] = useState(1)
  const [objFile, setObjFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [config, setConfig] = useState<ViewConfigState>({ ...DEFAULT_CONFIG })
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('perspective')
  const [selectedObserverId, setSelectedObserverId] = useState<string | null>(null)

  const modelConfig: ModelConfig | null = sceneUrl
    ? { url: sceneUrl, format: 'glb', autoCenter: true, zUp: false }
    : null
  const { state: modelState, scene: modelScene, bbox: modelBbox } = useModelLoader(modelConfig)

  // 관찰점 배치 (인터랙션 레이어)
  const placement = usePointPlacement({ prefix: 'V' })

  // Auto-transition
  useEffect(() => {
    if (phase === 'idle' && sessionId && currentStep === 1) setCurrentStep(2)
  }, [phase, sessionId, currentStep])

  useEffect(() => {
    if (phase === 'polling' || phase === 'running') setCurrentStep(3)
  }, [phase])

  useEffect(() => {
    if (phase === 'completed' && results) {
      setCurrentStep(4)
      setTimeout(() => {
        const el = document.getElementById('view-results-section')
        el?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  }, [phase, results])

  useEffect(() => {
    if (phase === 'polling' && progress) {
      document.title = `[${progress.overall_progress}%] 조망 분석 - BoLumiCloud`
    } else if (phase === 'completed') {
      document.title = '[완료] 조망 분석 - BoLumiCloud'
    } else {
      document.title = '조망 분석 - BoLumiCloud'
    }
    return () => { document.title = 'BoLumiCloud' }
  }, [phase, progress])

  const getCompletedSteps = (): number[] => {
    const steps: number[] = []
    if (sessionId) steps.push(1)
    if (currentStep > 2) steps.push(2)
    if (phase === 'completed') steps.push(3)
    return steps
  }

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    const obj = files.find((f) => f.name.toLowerCase().endsWith('.obj'))
    if (obj) setObjFile(obj)
  }, [])

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
    // BaseAnalysisPoint -> ViewObserverPoint (API 형식)
    const observers: ViewObserverPoint[] = placement.points.map((p) => ({
      id: p.id,
      x: p.position.x,
      y: p.position.y,
      z: p.position.z,
      name: p.name,
      ...(p.normal ? {
        normal_dx: p.normal.dx,
        normal_dy: p.normal.dy,
        normal_dz: p.normal.dz,
      } : {}),
    }))

    const analysisConfig: ViewConfig = {
      latitude: config.latitude,
      longitude: config.longitude,
      hemisphere_resolution: config.hemisphereResolution,
      projection_type: config.projectionType,
      observer_points: observers,
      landscape_categories: {},
    }
    await runAnalysis(analysisConfig)
  }, [config, runAnalysis, placement.points])

  const handleReset = useCallback(() => {
    reset()
    setCurrentStep(1)
    setObjFile(null)
    setConfig({ ...DEFAULT_CONFIG })
    placement.clearPoints()
    setSelectedObserverId(null)
  }, [reset, placement])

  const handleConfigChange = useCallback((partial: Partial<ViewConfigState>) => {
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
              onClick={() => setCurrentStep(2)}
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

      {/* Step Indicator */}
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">{t(txt.cancelled)}</p>
          <button onClick={handleReset} className="mt-2 text-xs text-amber-600 hover:text-amber-800 underline">
            처음부터 다시 시작
          </button>
        </motion.div>
      )}

      {/* Error Banner */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={handleReset} className="mt-2 text-xs text-red-500 hover:text-red-700 underline">
            {t(txt.reset)}
          </button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* ========== Step 1: Upload ========== */}
        {currentStep === 1 && (
          <motion.div key="step-1" variants={fadeVariants} initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.25 }} className="space-y-6"
          >
            <div
              onDragOver={(e) => { e.preventDefault(); if (!isUploading && !sessionId) setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => !isUploading && !sessionId && inputRef.current?.click()}
              className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
                isUploading || sessionId
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  : isDragging ? 'border-red-600 bg-red-50' : 'border-gray-300 hover:border-red-600/30'
              }`}
            >
              <input ref={inputRef} type="file" accept=".obj" onChange={handleFileChange} className="hidden"
                disabled={isUploading || !!sessionId} />
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

            {objFile && (
              <div className="border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">{objFile.name}</p>
                  <p className="text-xs text-gray-400">{(objFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                </div>
                {!sessionId && (
                  <button onClick={() => setObjFile(null)} className="text-xs text-gray-400 hover:text-red-500">제거</button>
                )}
              </div>
            )}

            {canUpload && !sessionId && (
              <div className="pt-2">
                <button onClick={handleUpload} disabled={isUploading}
                  className="border border-gray-200 hover:border-red-600/30 px-8 py-3
                    text-gray-900 hover:text-red-600 transition-all duration-300 disabled:opacity-50"
                >
                  {isUploading ? t(txt.uploading) : t(txt.uploadBtn)}
                </button>
              </div>
            )}

            {sessionId && modelState === 'loaded' && modelScene && (
              <div className="border border-gray-200 relative">
                <ThreeViewer bbox={modelBbox} height="360px">
                  <SceneLighting />
                  <BuildingModel scene={modelScene} bbox={modelBbox} />
                  <GroundGrid bbox={modelBbox} />
                  <CompassRose bbox={modelBbox} />
                </ThreeViewer>
                <CameraPresetBar bbox={modelBbox} activePreset={cameraPreset} onPresetChange={setCameraPreset} />
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
              <div className="border border-gray-200 p-8 text-center">
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-400">3D 모델 변환 중...</p>
              </div>
            )}

            {sessionId && (
              <div className="pt-2">
                <button onClick={() => setCurrentStep(2)}
                  className="border border-gray-200 hover:border-red-600/30 px-8 py-3
                    text-gray-900 hover:text-red-600 transition-all duration-300"
                >
                  {t(txt.continue)}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ========== Step 2: Settings + 관찰점 배치 ========== */}
        {currentStep === 2 && (
          <motion.div key="step-2" variants={fadeVariants} initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.25 }} className="space-y-8"
          >
            <div className={`${modelScene ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : ''}`}>
              <div className="space-y-6">
                <ViewConfigPanel config={config} onChange={handleConfigChange} disabled={isRunning} />
              </div>

              {modelScene && (
                <div className="border border-gray-200 relative">
                  <InteractionToolbar
                    analysisType="view"
                    mode={placement.mode}
                    pointCount={placement.points.length}
                    onModeChange={placement.setMode}
                    onClearAll={placement.clearPoints}
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
                      allowedSurfaces={['wall', 'roof']}
                      onSurfaceHover={placement.setHoverHit}
                      onSurfaceClick={placement.handleSurfaceClick}
                    />
                    <GroundGrid bbox={modelBbox} />
                    <CompassRose bbox={modelBbox} />
                    <SurfaceHighlight hit={placement.hoverHit} />
                    {placement.points.map((point) => (
                      <PointMarker3D
                        key={point.id}
                        point={point}
                        visualType="disc"
                        isSelected={point.id === placement.selectedPointId}
                        color="#60a5fa"
                        onClick={() => placement.handlePointClick(point.id)}
                      />
                    ))}
                  </ThreeViewer>
                  <CameraPresetBar bbox={modelBbox} activePreset={cameraPreset} onPresetChange={setCameraPreset} />
                  {placement.points.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        {placement.points.length}개 관찰점 배치됨
                        {placement.mode === 'place_point' && ' — 건물 벽면을 클릭하여 추가'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <button onClick={() => setCurrentStep(1)}
                className="border border-gray-200 hover:border-gray-400 px-6 py-3
                  text-sm text-gray-700 hover:text-gray-900 transition-all duration-300"
              >
                {t(txt.back)}
              </button>
              <button onClick={handleStartAnalysis} disabled={isRunning}
                className="border border-gray-200 hover:border-red-600/30 px-8 py-3
                  text-gray-900 hover:text-red-600 transition-all duration-300 disabled:opacity-50"
              >
                {isRunning ? t(txt.running) : t(txt.startAnalysis)}
              </button>
            </div>
          </motion.div>
        )}

        {/* ========== Step 3: Progress ========== */}
        {currentStep === 3 && (
          <motion.div key="step-3" variants={fadeVariants} initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.25 }}
          >
            {progress && (
              <ViewProgressView progress={progress} estimatedRemainingSec={estimatedRemainingSec} />
            )}
            {!progress && isRunning && (
              <div className="border border-gray-200 p-8 text-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">{t(txt.running)}</p>
              </div>
            )}
            {isRunning && (
              <div className="pt-4">
                <button onClick={cancelAnalysis}
                  className="border border-gray-200 hover:border-red-600/30 px-6 py-3
                    text-sm text-gray-700 hover:text-red-600 transition-all duration-300"
                >
                  {t(txt.cancel)}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ========== Step 4: Results ========== */}
        {currentStep === 4 && results && (
          <motion.div key="step-4" id="view-results-section" variants={fadeVariants}
            initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.25 }} className="space-y-6"
          >
            <ViewResults
              results={results}
              selectedObserverId={selectedObserverId}
              onObserverSelect={setSelectedObserverId}
            />

            <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
              <button onClick={() => setCurrentStep(2)}
                className="border border-gray-200 hover:border-gray-400 px-6 py-3
                  text-sm text-gray-700 hover:text-gray-900 transition-all duration-300"
              >
                {t(txt.backToSettings)}
              </button>
              <button onClick={handleReset}
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

function ViewProgressView({
  progress,
  estimatedRemainingSec,
}: {
  progress: ViewProgressType
  estimatedRemainingSec: number | null
}) {
  const { t } = useLocalizedText()

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-gray-200 p-6">
      <div className="space-y-3 mb-6">
        {progress.stages.map((stage, idx) => {
          const label = VIEW_STAGE_LABELS[stage.name]
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
                  <span className={`text-sm ${
                    stage.status === 'completed' ? 'text-gray-700'
                    : stage.status === 'processing' ? 'text-blue-700 font-medium'
                    : stage.status === 'error' ? 'text-red-700'
                    : 'text-gray-400'
                  }`}>
                    {idx + 1}. {stageLabel}
                  </span>
                  {stage.duration_sec !== null && (
                    <span className="text-xs text-gray-400">({stage.duration_sec.toFixed(1)}s)</span>
                  )}
                </div>
                {stage.status === 'processing' && progress.stage_progress.total > 0 && (
                  <div className="mt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${(progress.stage_progress.completed / progress.stage_progress.total) * 100}%` }}
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

      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">{t(txt.overall)}</span>
          <span className="text-sm text-gray-600 tabular-nums">
            {progress.overall_progress}% ({formatDuration(progress.elapsed_sec)})
            {estimatedRemainingSec !== null && estimatedRemainingSec > 0 && (
              <> | 남은 시간 약 {formatEta(estimatedRemainingSec)}</>
            )}
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700"
            style={{ width: `${progress.overall_progress}%` }}
          />
        </div>
      </div>
    </motion.div>
  )
}
