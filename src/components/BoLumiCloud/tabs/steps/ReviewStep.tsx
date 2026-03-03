'use client'

import { motion } from 'framer-motion'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import ReviewSummary from '@/components/Pipeline/ReviewSummary'
import type { LocationTimeConfigState } from '@/components/Pipeline/LocationTimeConfig'
import type { QualityLevel, RenderParams } from '@/lib/types/pipeline'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  back: { ko: '이전', en: 'Back' } as LocalizedText,
  startPipeline: { ko: '파이프라인 시작', en: 'Start Pipeline' } as LocalizedText,
  running: { ko: '실행 중...', en: 'Running...' } as LocalizedText,
}

const fadeVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

interface ReviewStepProps {
  config: LocationTimeConfigState
  vfNames: string[]
  hasMtl: boolean
  quality: QualityLevel
  resolution: number
  renderParams: RenderParams
  isRunning: boolean
  onBack: () => void
  onStart: () => void
}

export default function ReviewStep({
  config,
  vfNames,
  hasMtl,
  quality,
  resolution,
  renderParams,
  isRunning,
  onBack,
  onStart,
}: ReviewStepProps) {
  const { t } = useLocalizedText()

  return (
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
        vfNames={vfNames}
        hasMtl={hasMtl}
        quality={quality}
        resolution={resolution}
        renderParams={renderParams}
      />

      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="border border-gray-200 hover:border-gray-400 px-6 py-3
            text-sm text-gray-700 hover:text-gray-900 transition-all duration-300"
        >
          {t(txt.back)}
        </button>
        <button
          onClick={onStart}
          disabled={isRunning}
          className="border border-gray-200 hover:border-red-600/30 px-8 py-3
            text-gray-900 hover:text-red-600 transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? t(txt.running) : t(txt.startPipeline)}
        </button>
      </div>
    </motion.div>
  )
}
