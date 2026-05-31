'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { FileSearch } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import EmptyState from '@/components/common/EmptyState'
import type { PrivacyAnalysisResult } from '@/lib/types/privacy'
import type { LocalizedText } from '@/lib/types/i18n'

import PrivacySummary from './PrivacySummary'
import PrivacyResultsTable from './PrivacyResultsTable'

const PrivacySceneOverlay = dynamic(
  () => import('./3d/PrivacySceneOverlay'),
  { ssr: false },
)

const txt = {
  summary: { ko: '요약', en: 'Summary' } as LocalizedText,
  view3d: { ko: '3D 뷰', en: '3D View' } as LocalizedText,
  data: { ko: '데이터', en: 'Data' } as LocalizedText,
}

interface PrivacyResultsProps {
  results: PrivacyAnalysisResult
  selectedPairId?: number | null
  onPairSelect?: (id: number) => void
  sceneUrl?: string | null
}

export default function PrivacyResults({
  results,
  selectedPairId,
  onPairSelect,
  sceneUrl,
}: PrivacyResultsProps) {
  const { t } = useLocalizedText()
  const [activeTab, setActiveTab] = useState<'summary' | '3d' | 'data'>('summary')

  if (!results.pairs || results.pairs.length === 0) {
    return (
      <EmptyState
        icon={FileSearch}
        title="프라이버시 분석 결과가 없습니다"
        description="분석 쌍이 올바르게 설정되었는지 확인하세요."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Analysis Info */}
      <div className="border border-gray-200 p-4">
        <p className="text-sm text-gray-700">
          분석 쌍 {results.summary.total_pairs_analyzed}개 |{' '}
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
            { id: '3d' as const, label: txt.view3d },
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
        <PrivacySummary summary={results.summary} />
      )}

      {activeTab === '3d' && (
        <PrivacySceneOverlay
          results={results}
          sceneUrl={sceneUrl ?? null}
          selectedPairId={selectedPairId ?? null}
          onPairSelect={onPairSelect ?? (() => {})}
        />
      )}

      {activeTab === 'data' && (
        <PrivacyResultsTable
          pairs={results.pairs}
          selectedPairId={selectedPairId}
          onPairSelect={onPairSelect}
        />
      )}
    </div>
  )
}
