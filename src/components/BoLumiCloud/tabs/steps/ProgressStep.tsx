'use client'

import { motion } from 'framer-motion'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import PipelineProgress from '@/components/Pipeline/PipelineProgress'
import type { PipelineProgress as PipelineProgressType } from '@/lib/types/pipeline'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  running: { ko: '실행 중...', en: 'Running...' } as LocalizedText,
  cancel: { ko: '파이프라인 취소', en: 'Cancel Pipeline' } as LocalizedText,
}

const fadeVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

interface ProgressStepProps {
  progress: PipelineProgressType | null
  isRunning: boolean
  onCancel: () => void
}

export default function ProgressStep({
  progress,
  isRunning,
  onCancel,
}: ProgressStepProps) {
  const { t } = useLocalizedText()

  return (
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
      {isRunning && (
        <div className="pt-4">
          <button
            onClick={onCancel}
            className="border border-gray-200 hover:border-red-600/30 px-6 py-3
              text-sm text-gray-700 hover:text-red-600 transition-all duration-300"
          >
            {t(txt.cancel)}
          </button>
        </div>
      )}
    </motion.div>
  )
}
