'use client'

import { useState } from 'react'
import { ArrowUpDown, FileSearch } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import EmptyState from '@/components/common/EmptyState'
import type { PairResult } from '@/lib/types/privacy'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  title: { ko: '쌍별 분석 결과', en: 'Pair Analysis Results' } as LocalizedText,
  pair: { ko: '쌍', en: 'Pair' } as LocalizedText,
  distance: { ko: '거리(m)', en: 'Distance(m)' } as LocalizedText,
  pii: { ko: 'PII', en: 'PII' } as LocalizedText,
  grade: { ko: '등급', en: 'Grade' } as LocalizedText,
  visibility: { ko: '가시율', en: 'Visibility' } as LocalizedText,
  observer: { ko: '관찰', en: 'Observer' } as LocalizedText,
  target: { ko: '대상', en: 'Target' } as LocalizedText,
}

type SortKey = 'id' | 'distance' | 'pii' | 'grade'
type SortDir = 'asc' | 'desc'

interface PrivacyResultsTableProps {
  pairs: PairResult[]
  selectedPairId?: number | null
  onPairSelect?: (id: number) => void
}

export default function PrivacyResultsTable({
  pairs,
  selectedPairId,
  onPairSelect,
}: PrivacyResultsTableProps) {
  const { t } = useLocalizedText()
  const [sortKey, setSortKey] = useState<SortKey>('grade')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...pairs].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'id') return mul * (a.id - b.id)
    if (sortKey === 'distance') return mul * (a.distance - b.distance)
    if (sortKey === 'pii') return mul * (a.pii - b.pii)
    if (sortKey === 'grade') return mul * (a.grade - b.grade)
    return 0
  })

  const gradeColor = (grade: number) => {
    if (grade === 1) return 'text-red-600'
    if (grade === 2) return 'text-amber-600'
    return 'text-green-600'
  }

  if (!pairs || pairs.length === 0) {
    return (
      <EmptyState
        icon={FileSearch}
        title="프라이버시 분석 결과가 없습니다"
        description="분석 쌍이 올바르게 설정되었는지 확인하세요."
      />
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">{t(txt.title)}</h3>

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {([
                { key: 'id' as SortKey, label: txt.pair },
                { key: 'id' as SortKey, label: txt.observer },
                { key: 'id' as SortKey, label: txt.target },
                { key: 'distance' as SortKey, label: txt.distance },
                { key: 'id' as SortKey, label: txt.visibility },
                { key: 'pii' as SortKey, label: txt.pii },
                { key: 'grade' as SortKey, label: txt.grade },
              ]).map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500
                    cursor-pointer hover:text-gray-700 select-none"
                >
                  <div className="flex items-center gap-1">
                    {t(col.label)}
                    <ArrowUpDown size={12} className="text-gray-400" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((pair) => (
              <tr
                key={pair.id}
                onClick={() => onPairSelect?.(pair.id)}
                className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedPairId === pair.id
                    ? 'bg-red-50 ring-1 ring-inset ring-red-200'
                    : ''
                }`}
              >
                <td className="px-3 py-3 text-gray-500 font-mono text-xs">#{pair.id}</td>
                <td className="px-3 py-3 text-gray-700 text-xs">
                  {pair.observer.building_name} {pair.observer.floor}F
                </td>
                <td className="px-3 py-3 text-gray-700 text-xs">
                  {pair.target.building_name} {pair.target.floor}F
                </td>
                <td className="px-3 py-3 tabular-nums text-gray-700">
                  {pair.distance.toFixed(1)}
                </td>
                <td className="px-3 py-3 tabular-nums text-gray-700">
                  {(pair.visibility_factor * 100).toFixed(0)}%
                </td>
                <td className="px-3 py-3 tabular-nums font-mono text-xs">
                  {pair.pii.toExponential(2)}
                </td>
                <td className={`px-3 py-3 font-medium ${gradeColor(pair.grade)}`}>
                  {pair.grade_label}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        {pairs.length}개 분석 쌍
      </p>
    </div>
  )
}
