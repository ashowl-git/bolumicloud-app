'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, ArrowUpDown } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import type { PointSunlightResult } from '@/lib/types/sunlight'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  title: { ko: '측정점별 결과', en: 'Point-by-Point Results' } as LocalizedText,
  id: { ko: 'ID', en: 'ID' } as LocalizedText,
  name: { ko: '이름', en: 'Name' } as LocalizedText,
  coords: { ko: '좌표', en: 'Coordinates' } as LocalizedText,
  totalHours: { ko: '총일조(h)', en: 'Total(h)' } as LocalizedText,
  continuousHours: { ko: '연속일조(h)', en: 'Cont.(h)' } as LocalizedText,
  status: { ko: '판정', en: 'Status' } as LocalizedText,
}

type SortKey = 'id' | 'total_hours' | 'continuous_hours' | 'compliant'
type SortDir = 'asc' | 'desc'

interface SunlightResultsTableProps {
  points: PointSunlightResult[]
}

export default function SunlightResultsTable({ points }: SunlightResultsTableProps) {
  const { t } = useLocalizedText()
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filter, setFilter] = useState<'all' | 'compliant' | 'non-compliant'>('all')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = points.filter((p) => {
    if (filter === 'compliant') return p.compliant
    if (filter === 'non-compliant') return !p.compliant
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'id') return mul * a.id.localeCompare(b.id)
    if (sortKey === 'total_hours') return mul * (a.total_hours - b.total_hours)
    if (sortKey === 'continuous_hours') return mul * (a.continuous_hours - b.continuous_hours)
    if (sortKey === 'compliant') return mul * (Number(a.compliant) - Number(b.compliant))
    return 0
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">{t(txt.title)}</h3>
        <div className="flex gap-2">
          {(['all', 'compliant', 'non-compliant'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs border transition-all duration-300 ${
                filter === f
                  ? 'border-red-600 text-red-600 bg-red-50'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {f === 'all' ? '전체' : f === 'compliant' ? '적합' : '부적합'}
              {f !== 'all' && (
                <span className="ml-1 text-gray-400">
                  ({f === 'compliant'
                    ? points.filter((p) => p.compliant).length
                    : points.filter((p) => !p.compliant).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {([
                { key: 'id' as SortKey, label: txt.id },
                { key: 'id' as SortKey, label: txt.name },
                { key: 'total_hours' as SortKey, label: txt.totalHours },
                { key: 'continuous_hours' as SortKey, label: txt.continuousHours },
                { key: 'compliant' as SortKey, label: txt.status },
              ] as const).map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500
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
            {sorted.map((point) => (
              <tr
                key={point.id}
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  !point.compliant ? 'bg-red-50/50' : ''
                }`}
              >
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{point.id}</td>
                <td className="px-4 py-3 text-gray-700">{point.name}</td>
                <td className="px-4 py-3 tabular-nums">
                  <span className={point.total_hours >= 4 ? 'text-green-600' : 'text-gray-700'}>
                    {point.total_hours.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums">
                  <span className={point.continuous_hours >= 2 ? 'text-green-600' : 'text-gray-700'}>
                    {point.continuous_hours.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {point.compliant ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 size={14} />
                      <span className="text-xs">적합</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle size={14} />
                      <span className="text-xs">부적합</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        {sorted.length}개 측정점 표시 (전체 {points.length}개)
      </p>
    </div>
  )
}
