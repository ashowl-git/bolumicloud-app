'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePipelineContext } from '@/contexts/PipelineContext'
import { useApi } from '@/contexts/ApiContext'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { QUALITY_DETAILS, MAX_RENDERS, DATE_PRESETS } from '@/lib/types/pipeline'
import type { PipelineConfig, MaterialOverride, QualityPreset, QualityLevel, RenderParams } from '@/lib/types/pipeline'
import type { LocationTimeConfigState } from '@/components/Pipeline/LocationTimeConfig'
import type { LocalizedText } from '@/lib/types/i18n'

import StepIndicator from '@/components/Pipeline/StepIndicator'
import UploadStep from './steps/UploadStep'
import ConfigurationStep from './steps/ConfigurationStep'
import ReviewStep from './steps/ReviewStep'
import ProgressStep from './steps/ProgressStep'
import ResultsStep from './steps/ResultsStep'

const txt = {
  reset: { ko: '새로 시작', en: 'Reset' } as LocalizedText,
  backToSettings: { ko: '설정으로', en: 'Back to Settings' } as LocalizedText,
}

const DEFAULT_PIPELINE_CONFIG: {
  config: LocationTimeConfigState
  quality: QualityLevel
  resolution: number
  renderParams: RenderParams
} = {
  config: {
    latitude: 37.5665,
    longitude: 126.978,
    timezone: 135,
    dates: [DATE_PRESETS[1]], // 하지 default
    selectedHours: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    skyType: 'sunny_with_sun',
  },
  quality: 'low',
  resolution: QUALITY_DETAILS.low.resolution,
  renderParams: {
    ab: QUALITY_DETAILS.low.ab,
    ad: QUALITY_DETAILS.low.ad,
    as: QUALITY_DETAILS.low.as,
    ar: QUALITY_DETAILS.low.ar,
  },
}

export default function SketchUpPipelineTab() {
  const { t } = useLocalizedText()
  const { apiUrl } = useApi()
  const {
    phase,
    sessionId,
    vfCount,
    progress,
    results,
    error,
    isCancelled,
    uploadFiles,
    runPipeline,
    cancelPipeline,
    reset,
    resetForRerun,
  } = usePipelineContext()

  // Step state
  const [currentStep, setCurrentStep] = useState(1)

  // File state (multi-VF)
  const [vfFiles, setVfFiles] = useState<File[]>([])
  const [objFile, setObjFile] = useState<File | null>(null)
  const [mtlFile, setMtlFile] = useState<File | null>(null)

  // Config state (multi-date)
  const [config, setConfig] = useState<LocationTimeConfigState>({ ...DEFAULT_PIPELINE_CONFIG.config })
  const [quality, setQuality] = useState<QualityLevel>(DEFAULT_PIPELINE_CONFIG.quality)
  const [resolution, setResolution] = useState(DEFAULT_PIPELINE_CONFIG.resolution)
  const [renderParams, setRenderParams] = useState<RenderParams>({ ...DEFAULT_PIPELINE_CONFIG.renderParams })
  const [materialOverrides, setMaterialOverrides] = useState<Record<string, MaterialOverride>>({})

  // Render count
  const renderCount = vfFiles.length * config.dates.length * config.selectedHours.length
  const renderExceeds = renderCount > MAX_RENDERS

  // Completed steps tracking
  const getCompletedSteps = (): number[] => {
    const steps: number[] = []
    if (sessionId) steps.push(1)
    if (currentStep > 2) steps.push(2)
    if (currentStep > 3) steps.push(3)
    if (phase === 'completed') steps.push(4)
    return steps
  }

  // Auto-transition based on phase changes
  useEffect(() => {
    if (phase === 'idle' && sessionId && currentStep === 1) {
      setCurrentStep(2)
    }
  }, [phase, sessionId, currentStep])

  useEffect(() => {
    if (phase === 'polling' || phase === 'running') {
      setCurrentStep(4)
    }
  }, [phase])

  useEffect(() => {
    if (phase === 'completed' && results) {
      setCurrentStep(5)
      setTimeout(() => {
        const el = document.getElementById('pipeline-results-section')
        el?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  }, [phase, results])

  // Browser tab title
  useEffect(() => {
    if (phase === 'polling' && progress) {
      document.title = `[${progress.overall_progress}%] BoLumiCloud`
    } else if (phase === 'completed') {
      document.title = '[완료] BoLumiCloud'
    } else {
      document.title = 'BoLumiCloud'
    }
    return () => {
      document.title = 'BoLumiCloud'
    }
  }, [phase, progress])

  // Handlers
  const handleFilesClassified = useCallback(
    (files: { vfFiles: File[]; obj: File | null; mtl: File | null }) => {
      setVfFiles(files.vfFiles)
      setObjFile(files.obj)
      setMtlFile(files.mtl)
    },
    []
  )

  const handleRemoveVf = useCallback((idx: number) => {
    setVfFiles(prev => prev.filter((_, i) => i !== idx))
  }, [])

  const handleUpload = useCallback(async () => {
    if (vfFiles.length === 0 || !objFile) return
    await uploadFiles(vfFiles, objFile, mtlFile)
  }, [vfFiles, objFile, mtlFile, uploadFiles])

  const handleContinueToReview = useCallback(() => {
    if (config.selectedHours.length === 0 || config.dates.length === 0) return
    if (renderExceeds) return
    setCurrentStep(3)
  }, [config.selectedHours, config.dates, renderExceeds])

  const handlePresetChange = useCallback((q: QualityPreset) => {
    const detail = QUALITY_DETAILS[q]
    setQuality(q)
    setResolution(detail.resolution)
    setRenderParams({ ab: detail.ab, ad: detail.ad, as: detail.as, ar: detail.ar })
  }, [])

  const handleParamsChange = useCallback((newRes: number, newParams: RenderParams) => {
    setResolution(newRes)
    setRenderParams(newParams)
    setQuality('custom')
  }, [])

  const handleStartPipeline = useCallback(async () => {
    const pipelineConfig: PipelineConfig = {
      latitude: config.latitude,
      longitude: config.longitude,
      timezone: config.timezone,
      dates: config.dates,
      hours: [...config.selectedHours].sort((a, b) => a - b),
      xres: resolution,
      yres: resolution,
      quality,
      skyType: config.skyType,
      materialOverrides: Object.keys(materialOverrides).length > 0 ? materialOverrides : undefined,
      renderParams: quality === 'custom' ? renderParams : undefined,
    }
    await runPipeline(pipelineConfig)
  }, [config, quality, resolution, renderParams, materialOverrides, runPipeline])

  const handleReset = useCallback(() => {
    reset()
    setCurrentStep(1)
    setVfFiles([])
    setObjFile(null)
    setMtlFile(null)
    setConfig({ ...DEFAULT_PIPELINE_CONFIG.config })
    setQuality(DEFAULT_PIPELINE_CONFIG.quality)
    setResolution(DEFAULT_PIPELINE_CONFIG.resolution)
    setRenderParams({ ...DEFAULT_PIPELINE_CONFIG.renderParams })
    setMaterialOverrides({})
  }, [reset])

  const handleBackToSettings = useCallback(() => {
    resetForRerun()
    setCurrentStep(2)
  }, [resetForRerun])

  const handleConfigChange = useCallback((partial: Partial<LocationTimeConfigState>) => {
    setConfig((prev) => ({ ...prev, ...partial }))
  }, [])

  const isUploading = phase === 'uploading'
  const isRunning = phase === 'running' || phase === 'polling'
  const canUpload = vfFiles.length > 0 && !!objFile && !isUploading

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div />
        <div className="flex gap-2">
          {currentStep === 5 && sessionId && (
            <button
              onClick={handleBackToSettings}
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
      <StepIndicator currentStep={currentStep} completedSteps={getCompletedSteps()} />

      {/* Cancel Banner */}
      {isCancelled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-amber-200 bg-amber-50 p-4"
        >
          <p className="text-sm text-amber-700">파이프라인이 취소되었습니다</p>
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
            {phase === 'error' && (
              <>
                <button
                  onClick={handleReset}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >
                  {t(txt.reset)}
                </button>
                <button
                  onClick={() => { resetForRerun(); setCurrentStep(3); }}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >
                  같은 설정으로 재시도
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <UploadStep
            vfFiles={vfFiles}
            objFile={objFile}
            mtlFile={mtlFile}
            isUploading={isUploading}
            sessionId={sessionId}
            canUpload={canUpload}
            onFilesClassified={handleFilesClassified}
            onRemoveVf={handleRemoveVf}
            onUpload={handleUpload}
          />
        )}

        {currentStep === 2 && (
          <ConfigurationStep
            apiUrl={apiUrl}
            sessionId={sessionId}
            config={config}
            quality={quality}
            resolution={resolution}
            renderParams={renderParams}
            materialOverrides={materialOverrides}
            vfCount={vfCount || vfFiles.length}
            isRunning={isRunning}
            renderExceeds={renderExceeds}
            onConfigChange={handleConfigChange}
            onPresetChange={handlePresetChange}
            onParamsChange={handleParamsChange}
            onMaterialOverridesChange={setMaterialOverrides}
            onContinue={handleContinueToReview}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <ReviewStep
            config={config}
            vfNames={vfFiles.map(f => f.name.replace('.vf', ''))}
            hasMtl={!!mtlFile}
            quality={quality}
            resolution={resolution}
            renderParams={renderParams}
            isRunning={isRunning}
            onBack={() => setCurrentStep(2)}
            onStart={handleStartPipeline}
          />
        )}

        {currentStep === 4 && (
          <ProgressStep
            progress={progress}
            isRunning={isRunning}
            onCancel={cancelPipeline}
          />
        )}

        {currentStep === 5 && results && sessionId && (
          <ResultsStep
            results={results}
            apiUrl={apiUrl}
            sessionId={sessionId}
            onBackToSettings={handleBackToSettings}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
