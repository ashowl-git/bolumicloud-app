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
  // 요약과 데이터 표를 한 화면에 통합 (탭 전환 없이 함께 본다)
  results: { ko: '결과', en: 'Results' } as LocalizedText,
  chart: { ko: '시간별 차트', en: 'Hourly Chart' } as LocalizedText,
  selectPoint: {
    ko: '아래 결과 표에서 측정점을 선택하면 시간별 일조 그래프가 표시됩니다.',
    en: 'Select a point in the results table to see its hourly sunlight chart.',
  } as LocalizedText,
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
  const [activeTab, setActiveTab] = useState<'results' | 'chart'>('results')

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

  const TABS = [
    { id: 'results' as const, label: txt.results },
    { id: 'chart' as const, label: txt.chart },
  ]

  return (
    <div className="space-y-6">
      {/* Analysis Info */}
      <div className="border border-gray-200 dark:border-slate-700 p-4 rounded-lg">
        <p className="text-sm text-gray-700 dark:text-slate-300">
          {results.analysis_date.label} ({results.analysis_date.month}/{results.analysis_date.day}) |{' '}
          ({results.location.latitude.toFixed(4)}, {results.location.longitude.toFixed(4)}) |{' '}
          {results.time_window.start}-{results.time_window.end} |{' '}
          {results.time_window.step_minutes}분 간격 |{' '}
          소요시간 {results.metadata.computation_time_sec.toFixed(1)}s |{' '}
          삼각형 {results.metadata.triangle_count.toLocaleString()}개
        </p>
      </div>

      {/* Tab Navigation (결과 통합 / 시간별 차트) */}
      <div className="border-b border-gray-200 dark:border-slate-700">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-300 ${
                activeTab === tab.id
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>
      </div>

      {/* 결과: 준수 요약 + 측정점 데이터 표를 한 화면에 (탭 전환 불필요) */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <SunlightComplianceSummary summary={results.summary} />
          <SunlightResultsTable
            points={results.points}
            selectedPointId={selectedPointId}
            onPointSelect={onPointSelect}
          />
        </div>
      )}

      {/* 시간별 차트 (측정점 선택 시) */}
      {activeTab === 'chart' && (
        selectedPoint ? (
          <SunlightHourlyChart
            point={selectedPoint}
            timeStart={results.time_window.start}
            stepMinutes={results.time_window.step_minutes}
          />
        ) : (
          <div className="border border-gray-200 dark:border-slate-700 p-8 text-center rounded-lg">
            <p className="text-sm text-gray-400 dark:text-slate-500">{t(txt.selectPoint)}</p>
          </div>
        )
      )}
    </div>
  )
}
