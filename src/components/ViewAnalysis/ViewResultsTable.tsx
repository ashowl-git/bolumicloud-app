'use client'

import { useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import type { ObserverViewResult } from '@/lib/types/view'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  title: { ko: '관찰점별 결과', en: 'Observer Results' } as LocalizedText,
  id: { ko: 'ID', en: 'ID' } as LocalizedText,
  name: { ko: '이름', en: 'Name' } as LocalizedText,
  svf: { ko: 'SVF', en: 'SVF' } as LocalizedText,
  sky: { ko: '하늘(%)', en: 'Sky(%)' } as LocalizedText,
  building: { ko: '건물(%)', en: 'Building(%)' } as LocalizedText,
  ground: { ko: '지면(%)', en: 'Ground(%)' } as LocalizedText,
}

type SortKey = 'id' | 'svf' | 'sky' | 'building'
type SortDir = 'asc' | 'desc'

interface ViewResultsTableProps {
  observers: ObserverViewResult[]
  selectedObserverId?: string | null
  onObserverSelect?: (id: string) => void
}

export default function ViewResultsTable({
  observers,
  selectedObserverId,
  onObserverSelect,
}: ViewResultsTableProps) {
  const { t } = useLocalizedText()
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...observers].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'id') return mul * a.id.localeCompare(b.id)
    if (sortKey === 'svf') return mul * (a.svf - b.svf)
    if (sortKey === 'sky') return mul * ((a.view_by_category.sky || 0) - (b.view_by_category.sky || 0))
    if (sortKey === 'building') return mul * ((a.view_by_category.building || 0) - (b.view_by_category.building || 0))
    return 0
  })

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-900">{t(txt.title)}</h3>

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {([
                { key: 'id' as SortKey, label: txt.id },
                { key: 'id' as SortKey, label: txt.name },
                { key: 'svf' as SortKey, label: txt.svf },
                { key: 'sky' as SortKey, label: txt.sky },
                { key: 'building' as SortKey, label: txt.building },
                { key: 'id' as SortKey, label: txt.ground },
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
            {sorted.map((obs) => (
              <tr
                key={obs.id}
                onClick={() => onObserverSelect?.(obs.id)}
                className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedObserverId === obs.id
                    ? 'bg-red-50 ring-1 ring-inset ring-red-200'
                    : ''
                }`}
              >
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{obs.id}</td>
                <td className="px-4 py-3 text-gray-700">{obs.name}</td>
                <td className="px-4 py-3 tabular-nums">
                  <span className={obs.svf >= 0.50 ? 'text-green-600' : obs.svf >= 0.20 ? 'text-amber-600' : 'text-red-600'}>
                    {(obs.svf * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums text-blue-600">
                  {obs.view_by_category.sky?.toFixed(1) ?? '-'}
                </td>
                <td className="px-4 py-3 tabular-nums text-gray-700">
                  {obs.view_by_category.building?.toFixed(1) ?? '-'}
                </td>
                <td className="px-4 py-3 tabular-nums text-gray-700">
                  {obs.view_by_category.ground?.toFixed(1) ?? '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        {observers.length}개 관찰점
      </p>
    </div>
  )
}
