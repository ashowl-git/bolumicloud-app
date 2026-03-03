'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, AlertCircle, Circle } from 'lucide-react'
import type { PipelineProgress as PipelineProgressType } from '@/lib/types/pipeline'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { usePipelineContext } from '@/contexts/PipelineContext'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  stageNames: {
    obj2rad: { ko: 'OBJ -> RAD 변환', en: 'OBJ -> RAD Conversion' } as LocalizedText,
    materials: { ko: '재질 정의 생성', en: 'Material Definitions' } as LocalizedText,
    gensky: { ko: '하늘 파일 생성', en: 'Sky File Generation' } as LocalizedText,
    oconv: { ko: 'Octree 생성', en: 'Octree Generation' } as LocalizedText,
    rpict: { ko: 'rpict 렌더링', en: 'rpict Rendering' } as LocalizedText,
    evalglare: { ko: 'evalglare DGP 분석', en: 'evalglare DGP Analysis' } as LocalizedText,
  } as Record<string, LocalizedText>,
  elapsed: { ko: '경과', en: 'Elapsed' } as LocalizedText,
  overall: { ko: '전체', en: 'Overall' } as LocalizedText,
  current: { ko: '현재:', en: 'Current:' } as LocalizedText,
}

interface PipelineProgressProps {
  progress: PipelineProgressType
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
  if (minutes > 0) {
    return `${minutes}분 ${seconds}초`
  }
  return `${seconds}초`
}

export default function PipelineProgress({ progress }: PipelineProgressProps) {
  const { t } = useLocalizedText()
  const { estimatedRemainingSec } = usePipelineContext()

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
          const stageLabel = t(txt.stageNames[stage.name] || { ko: stage.name, en: stage.name })

          return (
            <div key={stage.name} className="flex items-center gap-3">
              {/* Status Icon */}
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                {stage.status === 'completed' ? (
                  <CheckCircle2 size={18} className="text-green-600" />
                ) : stage.status === 'processing' ? (
                  <Loader2 size={18} className="text-blue-600 animate-spin" />
                ) : stage.status === 'error' ? (
                  <AlertCircle size={18} className="text-red-600" />
                ) : (
                  <Circle size={18} className="text-gray-300" />
                )}
              </div>

              {/* Stage Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${
                    stage.status === 'completed' ? 'text-gray-700' :
                    stage.status === 'processing' ? 'text-blue-700 font-medium' :
                    stage.status === 'error' ? 'text-red-700' :
                    'text-gray-400'
                  }`}>
                    {idx + 1}. {stageLabel}
                  </span>
                  {stage.duration_sec !== null && (
                    <span className="text-xs text-gray-400">
                      ({stage.duration_sec.toFixed(1)}s)
                    </span>
                  )}
                </div>

                {/* rpict/evalglare sub-progress */}
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
                            width: `${(progress.stage_progress.completed / progress.stage_progress.total) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums">
                        {progress.stage_progress.completed}/{progress.stage_progress.total}
                      </span>
                    </div>
                    {progress.stage_progress.current_item && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {t(txt.current)} {progress.stage_progress.current_item}
                      </p>
                    )}
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
