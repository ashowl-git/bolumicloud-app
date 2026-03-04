'use client'

import { Loader2 } from 'lucide-react'
import type { SunlightAnalysisResult } from '@/lib/types/sunlight'

interface AnalysisControlSectionProps {
  isRunning: boolean
  onStartAnalysis: () => void
  results: SunlightAnalysisResult | null
  disabled?: boolean
  noPoints: boolean
}

export default function AnalysisControlSection({
  isRunning,
  onStartAnalysis,
  results,
  disabled,
  noPoints,
}: AnalysisControlSectionProps) {
  const footerDisabled = isRunning || disabled || noPoints

  return (
    <div className="space-y-1.5">
      <button
        onClick={onStartAnalysis}
        disabled={footerDisabled}
        className="w-full flex items-center justify-center gap-2 border border-gray-200
          hover:border-red-600/30 py-2.5 text-sm text-gray-900 hover:text-red-600
          transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed
          disabled:hover:border-gray-200 disabled:hover:text-gray-900"
      >
        {isRunning && <Loader2 size={14} className="animate-spin" />}
        {isRunning ? '분석 중...' : results ? '재분석' : '분석 시작'}
      </button>
      {results && !isRunning && (
        <p className="text-[10px] text-gray-400 text-center">
          측정점을 수정한 후 재분석할 수 있습니다
        </p>
      )}
      {noPoints && !isRunning && !results && (
        <p className="text-[10px] text-gray-400 text-center">
          측정점을 먼저 배치하세요
        </p>
      )}
    </div>
  )
}
