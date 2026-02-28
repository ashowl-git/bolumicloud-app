'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePipelineContext } from '@/contexts/PipelineContext'
import { useApi } from '@/contexts/ApiContext'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { QUALITY_DETAILS, MAX_RENDERS, DATE_PRESETS } from '@/lib/types/pipeline'
import type { PipelineConfig, MaterialOverride } from '@/lib/types/pipeline'
import type { GlareResult } from '@/lib/types/glare'
import type { LocalizedText } from '@/lib/types/i18n'

import StepIndicator from '@/components/Pipeline/StepIndicator'
import MaterialEditor from '@/components/Pipeline/MaterialEditor'
import UnifiedFileDropZone from '@/components/Pipeline/UnifiedFileDropZone'
import FileTypeChecklist from '@/components/Pipeline/FileTypeChecklist'
import LocationTimeConfig from '@/components/Pipeline/LocationTimeConfig'
import type { LocationTimeConfigState } from '@/components/Pipeline/LocationTimeConfig'
import QualityCards from '@/components/Pipeline/QualityCards'
import ReviewSummary from '@/components/Pipeline/ReviewSummary'
import PipelineProgress from '@/components/Pipeline/PipelineProgress'
import PipelineImageGallery from '@/components/Pipeline/PipelineImageGallery'
import PipelineImageViewer from '@/components/Pipeline/PipelineImageViewer'
import PipelineDownloads from '@/components/Pipeline/PipelineDownloads'
import ResultsChart from '@/components/GlareAnalysis/ResultsChart'
import ResultsTable from '@/components/GlareAnalysis/ResultsTable'

const txt = {
  title: { ko: 'SketchUp -> Radiance 파이프라인', en: 'SketchUp -> Radiance Pipeline' } as LocalizedText,
  uploadBtn: { ko: '파일 업로드', en: 'Upload Files' } as LocalizedText,
  uploading: { ko: '업로드 중...', en: 'Uploading...' } as LocalizedText,
  continue: { ko: '다음', en: 'Continue' } as LocalizedText,
  back: { ko: '이전', en: 'Back' } as LocalizedText,
  startPipeline: { ko: '파이프라인 시작', en: 'Start Pipeline' } as LocalizedText,
  running: { ko: '실행 중...', en: 'Running...' } as LocalizedText,
  reset: { ko: '새로 시작', en: 'Reset' } as LocalizedText,
  quality: { ko: '렌더 품질', en: 'Render Quality' } as LocalizedText,
  hoursRequired: { ko: '시간을 1개 이상 선택해주세요', en: 'Select at least 1 hour' } as LocalizedText,
  datesRequired: { ko: '날짜를 1개 이상 선택해주세요', en: 'Select at least 1 date' } as LocalizedText,
  renderExceeds: { ko: '렌더 수가 최대값을 초과합니다', en: 'Render count exceeds maximum' } as LocalizedText,
}

const fadeVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
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
    uploadFiles,
    runPipeline,
    reset,
  } = usePipelineContext()

  // Step state
  const [currentStep, setCurrentStep] = useState(1)

  // File state (multi-VF)
  const [vfFiles, setVfFiles] = useState<File[]>([])
  const [objFile, setObjFile] = useState<File | null>(null)
  const [mtlFile, setMtlFile] = useState<File | null>(null)

  // Config state (multi-date)
  const [config, setConfig] = useState<LocationTimeConfigState>({
    latitude: 37.5665,
    longitude: 126.978,
    timezone: 135,
    dates: [DATE_PRESETS[1]], // 하지 default
    selectedHours: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    skyType: 'sunny_with_sun',
  })
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('low')
  const [materialOverrides, setMaterialOverrides] = useState<Record<string, MaterialOverride>>({})

  // Image viewer state
  const [viewerResult, setViewerResult] = useState<GlareResult | null>(null)

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

  const handleStartPipeline = useCallback(async () => {
    const detail = QUALITY_DETAILS[quality]
    const pipelineConfig: PipelineConfig = {
      latitude: config.latitude,
      longitude: config.longitude,
      timezone: config.timezone,
      dates: config.dates,
      hours: [...config.selectedHours].sort((a, b) => a - b),
      xres: detail.resolution,
      yres: detail.resolution,
      quality,
      skyType: config.skyType,
      materialOverrides: Object.keys(materialOverrides).length > 0 ? materialOverrides : undefined,
    }
    await runPipeline(pipelineConfig)
  }, [config, quality, materialOverrides, runPipeline])

  const handleReset = useCallback(() => {
    reset()
    setCurrentStep(1)
    setVfFiles([])
    setObjFile(null)
    setMtlFile(null)
    setConfig({
      latitude: 37.5665,
      longitude: 126.978,
      timezone: 135,
      dates: [DATE_PRESETS[1]],
      selectedHours: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
      skyType: 'sunny_with_sun',
    })
    setQuality('low')
    setMaterialOverrides({})
    setViewerResult(null)
  }, [reset])

  const handleConfigChange = useCallback((partial: Partial<LocationTimeConfigState>) => {
    setConfig((prev) => ({ ...prev, ...partial }))
  }, [])

  const isUploading = phase === 'uploading'
  const isRunning = phase === 'running' || phase === 'polling'
  const canUpload = vfFiles.length > 0 && !!objFile && !isUploading

  // Check if results have multiple viewpoints/dates (for showing new charts)
  const hasMultipleViewpoints = results
    ? new Set(results.results.map(r => r.viewp).filter(Boolean)).size > 1
    : false
  const hasMultipleDates = results
    ? new Set(results.results.map(r => r.date_label).filter(Boolean)).size > 1
    : false

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div />
        {currentStep > 1 && (
          <button
            onClick={handleReset}
            className="border border-gray-200 hover:border-red-600/30 px-4 py-2
              text-sm text-gray-900 hover:text-red-600 transition-all duration-300"
          >
            {t(txt.reset)}
          </button>
        )}
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} completedSteps={getCompletedSteps()} />

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-red-200 bg-red-50 p-4"
        >
          <p className="text-sm text-red-600">{error}</p>
          {phase === 'error' && (
            <button
              onClick={handleReset}
              className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
            >
              {t(txt.reset)}
            </button>
          )}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* ========== Step 1: Files ========== */}
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
            <UnifiedFileDropZone
              onFilesClassified={handleFilesClassified}
              currentFiles={{ vfFiles, obj: objFile, mtl: mtlFile }}
              disabled={isUploading || !!sessionId}
              isProcessing={isUploading}
            />

            <FileTypeChecklist
              vfFiles={vfFiles}
              objFile={objFile}
              mtlFile={mtlFile}
              onRemoveVf={!sessionId ? handleRemoveVf : undefined}
            />

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
          </motion.div>
        )}

        {/* ========== Step 2: Settings ========== */}
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
            {/* Material Editor */}
            {sessionId && (
              <MaterialEditor
                apiUrl={apiUrl}
                sessionId={sessionId}
                overrides={materialOverrides}
                onChange={setMaterialOverrides}
                disabled={isRunning}
              />
            )}

            <LocationTimeConfig
              config={config}
              onChange={handleConfigChange}
              vfCount={vfCount || vfFiles.length}
              disabled={isRunning}
            />

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">{t(txt.quality)}</h3>
              <QualityCards selected={quality} onChange={setQuality} disabled={isRunning} />
            </div>

            {/* Continue button */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setCurrentStep(1)}
                className="border border-gray-200 hover:border-gray-400 px-6 py-3
                  text-sm text-gray-700 hover:text-gray-900 transition-all duration-300"
              >
                {t(txt.back)}
              </button>
              <button
                onClick={handleContinueToReview}
                disabled={config.selectedHours.length === 0 || config.dates.length === 0 || renderExceeds}
                className="border border-gray-200 hover:border-red-600/30 px-8 py-3
                  text-gray-900 hover:text-red-600 transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t(txt.continue)}
              </button>
              {config.selectedHours.length === 0 && (
                <span className="text-xs text-red-400">{t(txt.hoursRequired)}</span>
              )}
              {config.dates.length === 0 && (
                <span className="text-xs text-red-400">{t(txt.datesRequired)}</span>
              )}
              {renderExceeds && (
                <span className="text-xs text-red-400">{t(txt.renderExceeds)}</span>
              )}
            </div>
          </motion.div>
        )}

        {/* ========== Step 3: Review ========== */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <ReviewSummary
              config={config}
              vfNames={vfFiles.map(f => f.name.replace('.vf', ''))}
              hasMtl={!!mtlFile}
              quality={quality}
            />

            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="border border-gray-200 hover:border-gray-400 px-6 py-3
                  text-sm text-gray-700 hover:text-gray-900 transition-all duration-300"
              >
                {t(txt.back)}
              </button>
              <button
                onClick={handleStartPipeline}
                disabled={isRunning}
                className="border border-gray-200 hover:border-red-600/30 px-8 py-3
                  text-gray-900 hover:text-red-600 transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? t(txt.running) : t(txt.startPipeline)}
              </button>
            </div>
          </motion.div>
        )}

        {/* ========== Step 4: Progress ========== */}
        {currentStep === 4 && (
          <motion.div
            key="step-4"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
          >
            {progress && <PipelineProgress progress={progress} />}
            {!progress && isRunning && (
              <div className="border border-gray-200 p-8 text-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500">{t(txt.running)}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ========== Step 5: Results ========== */}
        {currentStep === 5 && results && (
          <motion.div
            key="step-5"
            id="pipeline-results-section"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="space-y-10"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="border border-gray-200 p-6">
                <p className="text-sm text-gray-800 mb-2">총 렌더</p>
                <p className="text-4xl font-light text-gray-900">
                  {results.summary.total}
                </p>
              </div>

              <div className="border border-gray-200 p-6">
                <p className="text-sm text-gray-800 mb-2">불능현휘</p>
                <p className="text-4xl font-light text-red-600">
                  {results.summary.disability_count}
                </p>
                <p className="text-xs text-gray-800 mt-2">
                  {results.summary.total > 0
                    ? ((results.summary.disability_count / results.summary.total) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>

              <div className="border border-gray-200 p-6">
                <p className="text-sm text-gray-800 mb-2">평균 DGP</p>
                <p className="text-4xl font-light text-gray-900">
                  {Number(results.summary.average_dgp).toFixed(3)}
                </p>
                <p className="text-xs text-gray-800 mt-2">
                  최대: {Number(results.summary.max_dgp).toFixed(3)}
                </p>
              </div>

              <div className="border border-gray-200 p-6">
                <p className="text-sm text-gray-800 mb-2">평균 휘도</p>
                <p className="text-4xl font-light text-gray-900">
                  {Number(results.summary.average_luminance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-gray-800 mt-2">cd/m2</p>
              </div>
            </div>

            {/* Pipeline Info */}
            {(() => {
              const info = (results as unknown as Record<string, unknown>).pipeline_info as
                | { total_duration_sec: number; quality: string; resolution: string; renders: number; vf_count?: number; date_count?: number }
                | undefined
              if (!info) return null
              return (
                <div className="border border-gray-200 p-4">
                  <p className="text-sm text-gray-700">
                    총 소요 시간 {(info.total_duration_sec / 60).toFixed(1)}min |{' '}
                    {info.quality} | {info.resolution} |{' '}
                    {info.vf_count && info.vf_count > 1 ? `${info.vf_count} VFs | ` : ''}
                    {info.date_count && info.date_count > 1 ? `${info.date_count} dates | ` : ''}
                    렌더 수 {info.renders}
                  </p>
                </div>
              )
            })()}

            {/* Image Gallery */}
            {results.results.length > 0 && sessionId && (
              <PipelineImageGallery
                results={results.results}
                apiUrl={apiUrl}
                sessionId={sessionId}
                onImageClick={(r) => setViewerResult(r)}
              />
            )}

            {/* Downloads */}
            {sessionId && (
              <PipelineDownloads apiUrl={apiUrl} sessionId={sessionId} />
            )}

            {/* Charts */}
            {results.results.length > 0 && (
              <div className="space-y-6">
                {/* Heatmap (viewpoint x time) */}
                {hasMultipleViewpoints && (
                  <ResultsChart results={results.results} chartType="heatmap" />
                )}

                {/* Date comparison */}
                {hasMultipleDates && (
                  <ResultsChart results={results.results} chartType="date_comparison" />
                )}

                {/* DGP Distribution */}
                <ResultsChart results={results.results} chartType="dgp_distribution" />

                {/* Existing charts */}
                <div className="grid md:grid-cols-2 gap-6">
                  <ResultsChart results={results.results} chartType="time" />
                  {hasMultipleViewpoints && (
                    <ResultsChart results={results.results} chartType="viewpoint" />
                  )}
                </div>
              </div>
            )}

            {/* Table */}
            {results.results.length > 0 && (
              <ResultsTable results={results.results} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Viewer Modal */}
      {viewerResult && sessionId && (
        <PipelineImageViewer
          result={viewerResult}
          apiUrl={apiUrl}
          sessionId={sessionId}
          onClose={() => setViewerResult(null)}
        />
      )}
    </div>
  )
}
