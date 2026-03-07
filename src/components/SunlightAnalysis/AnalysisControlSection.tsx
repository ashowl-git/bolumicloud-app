'use client'

import { Loader2, AlertCircle } from 'lucide-react'
import type { SunlightAnalysisResult } from '@/lib/types/sunlight'

interface AnalysisControlSectionProps {
  isRunning: boolean
  onStartAnalysis: () => void
  results: SunlightAnalysisResult | null
  disabled?: boolean
  noPoints: boolean
  error?: string | null
}

export default function AnalysisControlSection({
  isRunning,
  onStartAnalysis,
  results,
  disabled,
  noPoints,
  error,
}: AnalysisControlSectionProps) {
  const footerDisabled = isRunning || disabled || noPoints

  return (
    <div className="space-y-1.5">
      {/* 인라인 오류 표시 */}
      {error && !isRunning && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 text-xs text-red-700">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}
      <button
        onClick={onStartAnalysis}
        disabled={footerDisabled}
        className={`w-full flex items-center justify-center gap-2 border py-2.5 text-sm
          transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed
          disabled:hover:border-gray-200 disabled:hover:text-gray-900
          ${error && !isRunning
            ? 'border-red-300 text-red-600 hover:border-red-500 hover:bg-red-50'
            : 'border-gray-200 text-gray-900 hover:border-red-600/30 hover:text-red-600'
          }`}
      >
        {isRunning && <Loader2 size={14} className="animate-spin" />}
        {isRunning ? '분석 중...' : error ? '재시도' : results ? '재분석' : '분석 시작'}
      </button>
      {results && !isRunning && !error && (
        <p className="text-[10px] text-gray-400 text-center">
          측정점을 수정한 후 재분석할 수 있습니다
        </p>
      )}
      {noPoints && !isRunning && !results && !error && (
        <p className="text-[10px] text-gray-400 text-center">
          측정점을 먼저 배치하세요
        </p>
      )}
    </div>
  )
}
