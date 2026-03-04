'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, Settings, Loader2, BarChart3, EyeOff, CheckCircle2, AlertCircle, RotateCcw, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { usePrivacyPipelineContext } from '@/contexts/PrivacyPipelineContext'
import { PRIVACY_STAGE_LABELS } from '@/lib/types/privacy'
import type { PrivacyStage, WindowSpec } from '@/lib/types/privacy'
import type { LocalizedText } from '@/lib/types/i18n'

import PrivacyConfigPanel from './PrivacyConfigPanel'
import PrivacyResults from './PrivacyResults'
import ConfirmDialog from '@/components/common/ConfirmDialog'

// 3D 뷰어 + 인터랙션
import dynamic from 'next/dynamic'
import { useModelLoader } from '@/components/shared/3d/useModelLoader'
import { usePointPlacement } from '@/components/shared/3d/interaction/usePointPlacement'
import { threeToBackend, threeNormalToBackend } from '@/components/shared/3d/interaction/types'
import type { SurfaceHit } from '@/components/shared/3d/interaction/types'
import type { ModelConfig } from '@/components/shared/3d/types'
import InteractionToolbar from '@/components/shared/3d/interaction/InteractionToolbar'
const PrivacyBuildingViewer = dynamic(() => import('./3d/PrivacyBuildingViewer'), { ssr: false })

// ─── 텍스트 ────────────────────────────────
const txt = {
  title: { ko: '사생활 분석', en: 'Privacy Analysis' } as LocalizedText,
  subtitle: { ko: '인접 건물 간 사생활 침해를 정량적으로 분석합니다', en: 'Quantitative privacy infringement analysis between buildings' } as LocalizedText,
  step1: { ko: '모델 업로드', en: 'Upload Models' } as LocalizedText,
  step2: { ko: '분석 설정', en: 'Settings' } as LocalizedText,
  step3: { ko: '분석 실행', en: 'Analysis' } as LocalizedText,
  step4: { ko: '결과', en: 'Results' } as LocalizedText,
  uploadTarget: { ko: '피해 건물 (사생활 보호 대상)', en: 'Target Building' } as LocalizedText,
  uploadObserver: { ko: '가해 건물 (관찰이 발생하는 건물)', en: 'Observer Building' } as LocalizedText,
  dropHint: { ko: 'OBJ 파일을 드래그하거나 클릭', en: 'Drag OBJ file or click' } as LocalizedText,
  next: { ko: '다음', en: 'Next' } as LocalizedText,
  prev: { ko: '이전', en: 'Back' } as LocalizedText,
  startAnalysis: { ko: '분석 시작', en: 'Start Analysis' } as LocalizedText,
  cancel: { ko: '취소', en: 'Cancel' } as LocalizedText,
  reset: { ko: '초기화', en: 'Reset' } as LocalizedText,
  analyzing: { ko: '분석 중...', en: 'Analyzing...' } as LocalizedText,
  uploading: { ko: '업로드 중...', en: 'Uploading...' } as LocalizedText,
  elapsed: { ko: '경과 시간', en: 'Elapsed' } as LocalizedText,
}

const STEPS = [
  { id: 1, label: txt.step1, icon: Upload },
  { id: 2, label: txt.step2, icon: Settings },
  { id: 3, label: txt.step3, icon: Loader2 },
  { id: 4, label: txt.step4, icon: BarChart3 },
]

export default function PrivacyPipelineTab() {
  const { t } = useLocalizedText()
  const {
    phase, sessionId, config, progress, results,
    error,
    targetSceneUrl, observerSceneUrl,
    setConfig, upload, run, cancel, reset,
  } = usePrivacyPipelineContext()

  const [step, setStep] = useState(1)
  const [targetFile, setTargetFile] = useState<File | null>(null)
  const [observerFile, setObserverFile] = useState<File | null>(null)
  const [selectedPairId, setSelectedPairId] = useState<number | null>(null)
  const [activeRole, setActiveRole] = useState<'target' | 'observer'>('target')
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [dismissedError, setDismissedError] = useState<string | null>(null)

  const targetInputRef = useRef<HTMLInputElement>(null)
  const observerInputRef = useRef<HTMLInputElement>(null)
  const windowIdCounter = useRef(1)

  // 3D 모델 로딩
  const targetModelConfig: ModelConfig | null = targetSceneUrl
    ? { url: targetSceneUrl, format: 'glb', autoCenter: true, zUp: false } : null
  const observerModelConfig: ModelConfig | null = observerSceneUrl
    ? { url: observerSceneUrl, format: 'glb', autoCenter: true, zUp: false } : null

  const { scene: targetScene, bbox: targetBbox } = useModelLoader(targetModelConfig)
  const { scene: observerScene, bbox: observerBbox } = useModelLoader(observerModelConfig)

  // 창문 배치 (인터랙션 레이어)
  const placement = usePointPlacement({ prefix: 'W' })

  // Auto step transitions
  useEffect(() => {
    if (phase === 'polling' || phase === 'running') setStep(3)
    else if (phase === 'completed' && results) setStep(4)
  }, [phase, results])

  useEffect(() => {
    if (phase === 'polling' || phase === 'running') {
      document.title = `[${progress?.overall_progress?.toFixed(0) ?? 0}%] 사생활 분석`
    } else {
      document.title = '사생활 분석 | BoLumiCloud'
    }
  }, [phase, progress])

  const handleUpload = useCallback(async () => {
    if (!targetFile || !observerFile) return
    await upload(targetFile, observerFile)
    setStep(2)
  }, [targetFile, observerFile, upload])

  // 표면 클릭 -> WindowSpec 생성
  const handleWindowPlacement = useCallback((hit: SurfaceHit) => {
    const backend = threeToBackend(hit.point[0], hit.point[1], hit.point[2])
    const backendNormal = threeNormalToBackend(hit.normal[0], hit.normal[1], hit.normal[2])
    const buildingName = activeRole === 'target' ? 'target' : 'observer'
    const floor = Math.max(1, Math.floor(backend.z / 3.0) + 1)
    const id = `${activeRole === 'target' ? 'TW' : 'OW'}${windowIdCounter.current++}`

    const windowSpec: WindowSpec = {
      id,
      x: backend.x,
      y: backend.y,
      z: backend.z,
      normal_dx: backendNormal.dx,
      normal_dy: backendNormal.dy,
      normal_dz: backendNormal.dz,
      width: 1.2,
      height: 1.5,
      building_name: buildingName,
      floor,
    }

    if (activeRole === 'target') {
      setConfig({ targetWindows: [...config.targetWindows, windowSpec] })
    } else {
      setConfig({ observerWindows: [...config.observerWindows, windowSpec] })
    }
  }, [activeRole, config.targetWindows, config.observerWindows, setConfig])

  const handleRun = useCallback(async () => {
    await run()
  }, [run])

  const handleReset = useCallback(() => {
    reset()
    setStep(1)
    setTargetFile(null)
    setObserverFile(null)
    setSelectedPairId(null)
    setSelectedWindowId(null)
    placement.clearPoints()
    windowIdCounter.current = 1
  }, [reset, placement])

  // 개별 창문 삭제
  const handleRemoveWindow = useCallback((id: string) => {
    setConfig({
      targetWindows: config.targetWindows.filter((w) => w.id !== id),
      observerWindows: config.observerWindows.filter((w) => w.id !== id),
    })
    if (selectedWindowId === id) setSelectedWindowId(null)
  }, [config.targetWindows, config.observerWindows, setConfig, selectedWindowId])

  const canProceedStep1 = targetFile && observerFile && phase !== 'uploading'
  const canProceedStep2 = sessionId && phase !== 'running' && phase !== 'polling'
  const has3DModels = targetScene || observerScene
  const totalWindows = config.targetWindows.length + config.observerWindows.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <EyeOff size={28} strokeWidth={1.2} className="text-gray-400" />
          <div>
            <h1 className="text-2xl font-light text-gray-900">{t(txt.title)}</h1>
            <p className="text-sm text-gray-500">{t(txt.subtitle)}</p>
          </div>
        </div>
        {(phase !== 'idle' || step > 1) && (
          <button onClick={() => setShowResetConfirm(true)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors">
            <RotateCcw size={14} /> {t(txt.reset)}
          </button>
        )}
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="분석 초기화"
        message="현재 분석 결과와 설정이 모두 초기화됩니다. 계속하시겠습니까?"
        confirmLabel="초기화"
        cancelLabel="취소"
        onConfirm={() => { setShowResetConfirm(false); handleReset() }}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => { if (s.id < step || (s.id === 4 && results)) setStep(s.id) }}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-all duration-300 ${
                step === s.id
                  ? 'text-red-600 border-b-2 border-red-600'
                  : s.id < step || (s.id === 4 && results)
                  ? 'text-gray-700 cursor-pointer hover:text-red-600'
                  : 'text-gray-400'
              }`}
            >
              <s.icon size={14} />
              {t(s.label)}
            </button>
            {idx < STEPS.length - 1 && <span className="text-gray-300">—</span>}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && error !== dismissedError && (
        <div className="border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={() => setDismissedError(error)} className="text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Upload */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {/* Target File */}
            <div className="border border-gray-200 p-6">
              <label className="text-sm font-medium text-gray-900 mb-3 block">{t(txt.uploadTarget)}</label>
              <div
                onClick={() => targetInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-red-600/30 p-8 text-center cursor-pointer transition-colors"
              >
                {targetFile ? (
                  <p className="text-sm text-gray-700">{targetFile.name} ({(targetFile.size / 1024 / 1024).toFixed(1)} MB)</p>
                ) : (
                  <p className="text-sm text-gray-400">{t(txt.dropHint)}</p>
                )}
              </div>
              <input ref={targetInputRef} type="file" accept=".obj" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setTargetFile(e.target.files[0]) }} />
            </div>

            {/* Observer File */}
            <div className="border border-gray-200 p-6">
              <label className="text-sm font-medium text-gray-900 mb-3 block">{t(txt.uploadObserver)}</label>
              <div
                onClick={() => observerInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-red-600/30 p-8 text-center cursor-pointer transition-colors"
              >
                {observerFile ? (
                  <p className="text-sm text-gray-700">{observerFile.name} ({(observerFile.size / 1024 / 1024).toFixed(1)} MB)</p>
                ) : (
                  <p className="text-sm text-gray-400">{t(txt.dropHint)}</p>
                )}
              </div>
              <input ref={observerInputRef} type="file" accept=".obj" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setObserverFile(e.target.files[0]) }} />
            </div>

            <div className="flex justify-end">
              <button
                onClick={sessionId ? () => setStep(2) : handleUpload}
                disabled={!canProceedStep1}
                className="border border-gray-200 px-6 py-2.5 text-sm text-gray-700 hover:text-red-600 hover:border-red-600/30 transition-all duration-300 disabled:opacity-50"
              >
                {phase === 'uploading' ? t(txt.uploading) : t(txt.next)}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Settings + 3D 창문 배치 */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className={has3DModels ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : ''}>
              {/* 좌측: 설정 패널 */}
              <div className="space-y-6">
                <PrivacyConfigPanel
                  config={config}
                  onChange={setConfig}
                  disabled={phase === 'running' || phase === 'polling'}
                  onRemoveWindow={handleRemoveWindow}
                />
              </div>

              {/* 우측: 3D 뷰어 + 창문 배치 */}
              {has3DModels && (
                <div className="border border-gray-200 relative">
                  <InteractionToolbar
                    analysisType="privacy"
                    mode={placement.mode}
                    pointCount={totalWindows}
                    onModeChange={placement.setMode}
                    onClearAll={() => {
                      setConfig({ targetWindows: [], observerWindows: [] })
                      windowIdCounter.current = 1
                    }}
                    targetCount={config.targetWindows.length}
                    observerCount={config.observerWindows.length}
                    activeRole={activeRole}
                    onRoleChange={setActiveRole}
                  />
                  <PrivacyBuildingViewer
                    targetScene={targetScene}
                    observerScene={observerScene}
                    targetBbox={targetBbox}
                    observerBbox={observerBbox}
                    activeRole={activeRole}
                    interactionEnabled={placement.mode === 'place_point'}
                    hoverHit={placement.hoverHit}
                    onSurfaceHover={placement.setHoverHit}
                    onSurfaceClick={handleWindowPlacement}
                    orbitEnabled={placement.mode === 'navigate'}
                    targetWindows={config.targetWindows}
                    observerWindows={config.observerWindows}
                    selectedWindowId={selectedWindowId}
                    onWindowClick={setSelectedWindowId}
                  />
                  {totalWindows > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        <span className="text-orange-600">대상 {config.targetWindows.length}개</span>
                        {' / '}
                        <span className="text-blue-600">관찰 {config.observerWindows.length}개</span>
                        {placement.mode === 'place_point' && ` — ${activeRole === 'target' ? '대상' : '관찰'} 건물 벽면을 클릭하여 창문 추가`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="border border-gray-200 px-6 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                {t(txt.prev)}
              </button>
              <button
                onClick={handleRun}
                disabled={!canProceedStep2}
                className="border border-gray-200 px-6 py-2.5 text-sm text-gray-700 hover:text-red-600 hover:border-red-600/30 transition-all duration-300 disabled:opacity-50"
              >
                {t(txt.startAnalysis)}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Progress */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-light text-gray-900">{t(txt.analyzing)}</h3>
                <span className="text-sm text-gray-500">{t(txt.elapsed)}: {progress?.elapsed_sec?.toFixed(0) ?? 0}s</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-100 mb-6">
                <div
                  className="h-full bg-red-600 transition-all duration-500"
                  style={{ width: `${progress?.overall_progress ?? 0}%` }}
                />
              </div>

              {/* Stage Checklist */}
              <div className="space-y-3">
                {progress?.stages?.map((stage) => (
                  <div key={stage.name} className="flex items-center gap-3">
                    {stage.status === 'completed' ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : stage.status === 'processing' ? (
                      <Loader2 size={16} className="text-red-600 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 border border-gray-300 rounded-full" />
                    )}
                    <span className={`text-sm ${
                      stage.status === 'processing' ? 'text-red-600' : stage.status === 'completed' ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {t(PRIVACY_STAGE_LABELS[stage.name as PrivacyStage] || { ko: stage.name, en: stage.name })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={cancel}
                className="border border-gray-200 px-6 py-2.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                {t(txt.cancel)}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Results */}
        {step === 4 && results && (
          <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <PrivacyResults
              results={results}
              selectedPairId={selectedPairId}
              onPairSelect={setSelectedPairId}
              sceneUrl={null}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
