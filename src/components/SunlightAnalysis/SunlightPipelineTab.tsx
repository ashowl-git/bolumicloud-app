'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSunlightPipelineContext } from '@/contexts/SunlightPipelineContext'
import { useApi } from '@/contexts/ApiContext'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import type { SunlightConfig, SunlightConfigState } from '@/lib/types/sunlight'
import { DEFAULT_SUNLIGHT_CONFIG } from '@/lib/defaults/sunlight'
import type { LocalizedText } from '@/lib/types/i18n'
import type { CauseAnalysisResult } from '@/lib/types/sunlight'
import type { CameraPresetId, ModelConfig } from '@/components/shared/3d/types'
import { useModelLoader } from '@/components/shared/3d/useModelLoader'
import { useShadowAnimation } from './hooks/useShadowAnimation'
import { usePointPlacement } from '@/components/shared/3d/interaction/usePointPlacement'
import { useAreaPlacement } from '@/components/shared/3d/interaction/useAreaPlacement'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { UploadStep, SettingsStep, ProgressStep, ResultsStep, StepIndicator } from './pipeline'

const txt = {
  reset: { ko: '새로 시작', en: 'Reset' } as LocalizedText,
  backToSettings: { ko: '설정 변경', en: 'Change Settings' } as LocalizedText,
}

const fadeVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export default function SunlightPipelineTab() {
  const { t } = useLocalizedText()
  const { apiUrl } = useApi()
  const {
    phase, sessionId, sceneUrl, modelMeta, progress, results,
    error, isCancelled, estimatedRemainingSec,
    uploadFile, runAnalysis, cancelAnalysis, reset,
  } = useSunlightPipelineContext()

  const [currentStep, setCurrentStep] = useState(1)
  const [config, setConfig] = useState<SunlightConfigState>({ ...DEFAULT_SUNLIGHT_CONFIG })
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('perspective')
  const [causeResult, setCauseResult] = useState<CauseAnalysisResult | null>(null)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const modelConfig = useMemo<ModelConfig | null>(() =>
    sceneUrl ? { url: sceneUrl, format: 'glb', autoCenter: true, zUp: false } : null,
    [sceneUrl]
  )
  const { scene: modelScene, bbox: modelBbox } = useModelLoader(modelConfig)
  const shadow = useShadowAnimation({ apiUrl })
  const placement = usePointPlacement({ prefix: 'P' })
  const areaPlacement = useAreaPlacement('G')
  const isRunning = phase === 'running' || phase === 'polling'

  // Auto shadow on completion
  useEffect(() => {
    if (phase === 'completed' && results && sessionId && shadow.frames.length === 0 && !shadow.isComputing) {
      shadow.computeShadows({
        sessionId, latitude: config.latitude, longitude: config.longitude,
        month: config.date.month, day: config.date.day,
        timezoneOffset: config.timezone / 15, stepMinutes: 10,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, results, sessionId])

  // Phase -> step auto-transitions
  useEffect(() => {
    if (phase === 'idle' && sessionId && currentStep === 1) setCurrentStep(2)
  }, [phase, sessionId, currentStep])
  useEffect(() => {
    if (phase === 'polling' || phase === 'running') setCurrentStep(3)
  }, [phase])
  useEffect(() => {
    if (phase === 'completed' && results) setCurrentStep(4)
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

  const completedSteps = useMemo(() => {
    const s: number[] = []
    if (sessionId) s.push(1)
    if (currentStep > 2) s.push(2)
    if (phase === 'completed') s.push(3)
    return s
  }, [sessionId, currentStep, phase])

  const handleStartAnalysis = useCallback(async () => {
    const pts = placement.points.map((p) => ({
      id: p.id, x: p.position.x, y: p.position.y, z: p.position.z, name: p.name,
    }))
    const c: SunlightConfig = {
      latitude: config.latitude, longitude: config.longitude,
      timezone_offset: config.timezone / 15, standard_meridian: config.timezone,
      azimuth: config.azimuth, month: config.date.month, day: config.date.day,
      date_label: config.date.label, building_type: config.buildingType,
      time_start: `${String(config.totalThreshold.startHour).padStart(2, '0')}:00`,
      time_end: `${String(config.totalThreshold.endHour).padStart(2, '0')}:00`,
      continuous_start: `${String(config.continuousThreshold.startHour).padStart(2, '0')}:00`,
      continuous_end: `${String(config.continuousThreshold.endHour).padStart(2, '0')}:00`,
      total_required_hours: config.totalThreshold.requiredHours,
      continuous_required_hours: config.continuousThreshold.requiredHours,
      resolution: config.resolution, solar_time_mode: config.solarTimeMode,
      measurement_points: pts,
    }
    await runAnalysis(c)
  }, [config, runAnalysis, placement.points])

  const handleReset = useCallback(() => {
    reset(); setCurrentStep(1); setConfig({ ...DEFAULT_SUNLIGHT_CONFIG })
    placement.clearPoints(); areaPlacement.resetArea()
    setCauseResult(null); setSelectedBuildingId(null)
  }, [reset, placement, areaPlacement])

  const handleConfigChange = useCallback((partial: Partial<SunlightConfigState>) => {
    setConfig((prev) => ({ ...prev, ...partial }))
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div />
        <div className="flex gap-2">
          {currentStep === 4 && sessionId && (
            <button onClick={() => setCurrentStep(2)}
              className="border border-gray-200 hover:border-gray-400 px-4 py-3 text-sm text-gray-700 hover:text-gray-900 transition-all duration-300">
              {t(txt.backToSettings)}
            </button>
          )}
          {currentStep > 1 && (
            <button onClick={() => setShowResetConfirm(true)}
              className="border border-gray-200 hover:border-red-600/30 px-4 py-3 text-sm text-gray-900 hover:text-red-600 transition-all duration-300">
              {t(txt.reset)}
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm} title="분석 초기화"
        message="현재 분석 결과와 설정이 모두 초기화됩니다. 계속하시겠습니까?"
        confirmLabel="초기화" cancelLabel="취소"
        onConfirm={() => { setShowResetConfirm(false); handleReset() }}
        onCancel={() => setShowResetConfirm(false)}
      />

      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />

      {isCancelled && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">분석이 취소되었습니다</p>
          <button onClick={handleReset} className="mt-2 text-xs text-amber-600 hover:text-amber-800 underline">처음부터 다시 시작</button>
        </motion.div>
      )}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={handleReset} className="mt-2 text-xs text-red-500 hover:text-red-700 underline">{t(txt.reset)}</button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div key="step-1" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
            <UploadStep sessionId={sessionId} sceneUrl={sceneUrl} modelMeta={modelMeta}
              isUploading={phase === 'uploading'} onUpload={uploadFile} onContinue={() => setCurrentStep(2)}
              cameraPreset={cameraPreset} onCameraPresetChange={setCameraPreset} />
          </motion.div>
        )}
        {currentStep === 2 && (
          <motion.div key="step-2" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
            <SettingsStep config={config} onConfigChange={handleConfigChange} isRunning={isRunning}
              modelScene={modelScene} modelBbox={modelBbox} cameraPreset={cameraPreset}
              onCameraPresetChange={setCameraPreset} placement={placement} areaPlacement={areaPlacement}
              onBack={() => setCurrentStep(1)} onStartAnalysis={handleStartAnalysis} />
          </motion.div>
        )}
        {currentStep === 3 && (
          <motion.div key="step-3" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
            <ProgressStep progress={progress} estimatedRemainingSec={estimatedRemainingSec}
              isRunning={isRunning} onCancel={cancelAnalysis} />
          </motion.div>
        )}
        {currentStep === 4 && results && (
          <motion.div key="step-4" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
            <ResultsStep sessionId={sessionId} results={results} config={config}
              modelScene={modelScene} modelBbox={modelBbox} shadow={shadow}
              placementPoints={placement.points} selectedPointId={placement.selectedPointId}
              onPointSelect={placement.selectPoint} causeResult={causeResult} onCauseAnalysis={setCauseResult}
              selectedBuildingId={selectedBuildingId} onBuildingSelect={setSelectedBuildingId}
              onBackToSettings={() => setCurrentStep(2)} onReset={() => setShowResetConfirm(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
