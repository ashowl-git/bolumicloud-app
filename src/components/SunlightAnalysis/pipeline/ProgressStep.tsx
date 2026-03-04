'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { SUNLIGHT_STAGE_LABELS } from '@/lib/types/sunlight'
import { formatDuration, formatEta } from '@/lib/utils/format'
import type { SunlightProgress as SunlightProgressType } from '@/lib/types/sunlight'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  running: { ko: '분석 중...', en: 'Analyzing...' } as LocalizedText,
  cancel: { ko: '분석 취소', en: 'Cancel Analysis' } as LocalizedText,
  overall: { ko: '전체', en: 'Overall' } as LocalizedText,
}

export interface ProgressStepProps {
  progress: SunlightProgressType | null
  estimatedRemainingSec: number | null
  isRunning: boolean
  onCancel: () => void
}

export default function ProgressStep({
  progress,
  estimatedRemainingSec,
  isRunning,
  onCancel,
}: ProgressStepProps) {
  const { t } = useLocalizedText()

  return (
    <div>
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
            onClick={onCancel}
            aria-label="분석 취소"
            className="border border-gray-200 hover:border-red-600/30 px-6 py-3
              text-sm text-gray-700 hover:text-red-600 transition-all duration-300"
          >
            {t(txt.cancel)}
          </button>
        </div>
      )}
      {progress?.status === 'error' && progress.error && (
        <div className="mt-4 border border-red-200 bg-red-50 p-4" role="alert">
          <p className="text-sm text-red-700">{progress.error}</p>
        </div>
      )}
    </div>
  )
}

// ─── Progress sub-component ─────────────────────

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
