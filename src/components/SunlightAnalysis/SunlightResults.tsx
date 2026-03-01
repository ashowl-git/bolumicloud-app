'use client'

import { useState } from 'react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import type { SunlightAnalysisResult } from '@/lib/types/sunlight'
import type { LocalizedText } from '@/lib/types/i18n'

import SunlightComplianceSummary from './SunlightComplianceSummary'
import SunlightResultsTable from './SunlightResultsTable'

const txt = {
  summary: { ko: '요약', en: 'Summary' } as LocalizedText,
  data: { ko: '데이터', en: 'Data' } as LocalizedText,
  info: { ko: '분석 정보', en: 'Analysis Info' } as LocalizedText,
}

interface SunlightResultsProps {
  results: SunlightAnalysisResult
}

export default function SunlightResults({ results }: SunlightResultsProps) {
  const { t } = useLocalizedText()
  const [activeTab, setActiveTab] = useState<'summary' | 'data'>('summary')

  return (
    <div className="space-y-6">
      {/* Analysis Info */}
      <div className="border border-gray-200 p-4">
        <p className="text-sm text-gray-700">
          {results.analysis_date.label} ({results.analysis_date.month}/{results.analysis_date.day}) |{' '}
          ({results.location.latitude.toFixed(4)}, {results.location.longitude.toFixed(4)}) |{' '}
          {results.time_window.start}-{results.time_window.end} |{' '}
          {results.time_window.step_minutes}분 간격 |{' '}
          소요시간 {results.metadata.computation_time_sec.toFixed(1)}s |{' '}
          삼각형 {results.metadata.triangle_count.toLocaleString()}개
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {([
            { id: 'summary' as const, label: txt.summary },
            { id: 'data' as const, label: txt.data },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-300 ${
                activeTab === tab.id
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <SunlightComplianceSummary summary={results.summary} />
      )}

      {activeTab === 'data' && (
        <SunlightResultsTable points={results.points} />
      )}
    </div>
  )
}
