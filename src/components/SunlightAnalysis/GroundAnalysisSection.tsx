'use client'

import { Grid3X3, Loader2, AlertCircle } from 'lucide-react'
import type { SunlightAnalysisResult } from '@/lib/types/sunlight'

import WorkspacePanelSection from '../Workspace/WorkspacePanelSection'

interface GroundAnalysisSectionProps {
  gridInterval: number
  onGridIntervalChange?: (interval: number) => void
  onStartGroundAnalysis?: () => void
  isGroundAnalysisRunning: boolean
  results: SunlightAnalysisResult | null
  error?: string | null
  disabled?: boolean
}

export default function GroundAnalysisSection({
  gridInterval,
  onGridIntervalChange,
  onStartGroundAnalysis,
  isGroundAnalysisRunning,
  results,
  error,
  disabled,
}: GroundAnalysisSectionProps) {
  return (
    <WorkspacePanelSection title="지반일조 분석" icon={<Grid3X3 size={14} />} defaultOpen={false}>
      <div className="space-y-3">
        {/* Error display */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-2">
            <AlertCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-red-600">{error}</p>
          </div>
        )}

        {/* Grid interval */}
        <div>
          <label className="text-[10px] font-medium text-gray-500 block mb-1.5">
            격자 간격 (m)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0.5}
              max={10}
              step={0.5}
              value={gridInterval}
              onChange={(e) => onGridIntervalChange?.(Number(e.target.value))}
              disabled={disabled}
              className="flex-1 accent-red-600 h-1.5"
            />
            <input
              type="number"
              min={0.5}
              max={10}
              step={0.5}
              value={gridInterval}
              onChange={(e) => onGridIntervalChange?.(Number(e.target.value))}
              disabled={disabled}
              className="w-16 border border-gray-200 px-1.5 py-1 text-xs tabular-nums
                text-center focus:outline-none focus:border-red-600/30 disabled:opacity-50"
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            간격이 작을수록 정밀하지만 분석 시간이 증가합니다
          </p>
        </div>

        {/* Run button */}
        <button
          onClick={onStartGroundAnalysis}
          disabled={disabled || isGroundAnalysisRunning || !results}
          className="w-full flex items-center justify-center gap-2 border border-gray-200
            hover:border-red-600/30 py-2 text-xs text-gray-900 hover:text-red-600
            transition-all disabled:opacity-40 disabled:cursor-not-allowed
            disabled:hover:border-gray-200 disabled:hover:text-gray-900"
        >
          {isGroundAnalysisRunning && <Loader2 size={12} className="animate-spin" />}
          {isGroundAnalysisRunning ? '지반 분석 중...' : '지반일조 분석'}
        </button>
        {!results && (
          <p className="text-[10px] text-gray-400 text-center">
            일조 분석 완료 후 사용 가능
          </p>
        )}
      </div>
    </WorkspacePanelSection>
  )
}
