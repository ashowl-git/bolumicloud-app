'use client'

import { useState } from 'react'
import { FileSearch } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import EmptyState from '@/components/common/EmptyState'
import type { ViewAnalysisResult } from '@/lib/types/view'
import type { LocalizedText } from '@/lib/types/i18n'

import ViewSummary from './ViewSummary'
import ViewResultsTable from './ViewResultsTable'
import WaldramChart from '@/components/charts/WaldramChart'

const txt = {
  summary: { ko: '요약', en: 'Summary' } as LocalizedText,
  data: { ko: '데이터', en: 'Data' } as LocalizedText,
  waldram: { ko: 'Waldram', en: 'Waldram' } as LocalizedText,
  selectObserver: { ko: '테이블에서 관찰점을 선택하세요', en: 'Select an observer from the table' } as LocalizedText,
}

interface ViewResultsProps {
  results: ViewAnalysisResult
  selectedObserverId?: string | null
  onObserverSelect?: (id: string) => void
}

export default function ViewResults({
  results,
  selectedObserverId,
  onObserverSelect,
}: ViewResultsProps) {
  const { t } = useLocalizedText()
  const [activeTab, setActiveTab] = useState<'summary' | 'data' | 'waldram'>('summary')

  const selectedObserver = selectedObserverId
    ? results.observers.find((o) => o.id === selectedObserverId) ?? null
    : null

  if (!results.observers || results.observers.length === 0) {
    return (
      <EmptyState
        icon={FileSearch}
        title="조망 분석 결과가 없습니다"
        description="관찰점이 올바르게 설정되었는지 확인하세요."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Analysis Info */}
      <div className="border border-gray-200 p-4">
        <p className="text-sm text-gray-700">
          {results.projection_type} | 해상도 {results.hemisphere_resolution}px |{' '}
          소요시간 {results.metadata.computation_time_sec.toFixed(1)}s |{' '}
          삼각형 {results.metadata.triangle_count.toLocaleString()}개 |{' '}
          총 레이 {results.metadata.total_rays_cast.toLocaleString()}개
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {([
            { id: 'summary' as const, label: txt.summary },
            { id: 'data' as const, label: txt.data },
            { id: 'waldram' as const, label: txt.waldram },
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
        <ViewSummary summary={results.summary} />
      )}

      {activeTab === 'data' && (
        <ViewResultsTable
          observers={results.observers}
          selectedObserverId={selectedObserverId}
          onObserverSelect={onObserverSelect}
        />
      )}

      {activeTab === 'waldram' && (
        selectedObserver && selectedObserver.waldram_obstructions.length > 0 ? (
          <WaldramChart
            obstructions={selectedObserver.waldram_obstructions}
            viewpoint={{
              lat: results.summary.average_svf,
              lng: 0,
            }}
          />
        ) : (
          <div className="border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-400">
              {selectedObserver
                ? '이 관찰점에는 차폐 건물이 없습니다'
                : t(txt.selectObserver)}
            </p>
          </div>
        )
      )}
    </div>
  )
}
