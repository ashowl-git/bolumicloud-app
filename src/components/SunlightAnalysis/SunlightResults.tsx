'use client'

import { useState } from 'react'
import { FileSearch } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import EmptyState from '@/components/common/EmptyState'
import type { SunlightAnalysisResult } from '@/lib/types/sunlight'
import type { LocalizedText } from '@/lib/types/i18n'

import SunlightComplianceSummary from './SunlightComplianceSummary'
import SunlightResultsTable from './SunlightResultsTable'
import SunlightHourlyChart from './SunlightHourlyChart'

const txt = {
  summary: { ko: '요약', en: 'Summary' } as LocalizedText,
  data: { ko: '데이터', en: 'Data' } as LocalizedText,
  chart: { ko: '차트', en: 'Chart' } as LocalizedText,
  info: { ko: '분석 정보', en: 'Analysis Info' } as LocalizedText,
  selectPoint: { ko: '테이블에서 측정점을 선택하세요', en: 'Select a point from the table' } as LocalizedText,
}

interface SunlightResultsProps {
  results: SunlightAnalysisResult
  selectedPointId?: string | null
  onPointSelect?: (id: string) => void
}

export default function SunlightResults({
  results,
  selectedPointId,
  onPointSelect,
}: SunlightResultsProps) {
  const { t } = useLocalizedText()
  const [activeTab, setActiveTab] = useState<'summary' | 'data' | 'chart'>('summary')

  const selectedPoint = selectedPointId
    ? results.points.find((p) => p.id === selectedPointId) ?? null
    : null

  if (!results.points || results.points.length === 0) {
    return (
      <EmptyState
        icon={FileSearch}
        title="일조 분석 결과가 없습니다"
        description="측정점이 올바르게 설정되었는지 확인하세요."
      />
    )
  }

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
            { id: 'chart' as const, label: txt.chart },
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
        <SunlightResultsTable
          points={results.points}
          selectedPointId={selectedPointId}
          onPointSelect={onPointSelect}
        />
      )}

      {activeTab === 'chart' && (
        selectedPoint ? (
          <SunlightHourlyChart
            point={selectedPoint}
            timeStart={results.time_window.start}
            stepMinutes={results.time_window.step_minutes}
          />
        ) : (
          <div className="border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-400">{t(txt.selectPoint)}</p>
          </div>
        )
      )}
    </div>
  )
}
