'use client'

import { useState, useMemo } from 'react'
import { CheckCircle2, XCircle, ArrowUpDown, FileSearch } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import EmptyState from '@/components/common/EmptyState'
import type { PointSunlightResult, MeasurementPointGroup } from '@/lib/types/sunlight'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  title: { ko: '측정점별 결과', en: 'Point-by-Point Results' } as LocalizedText,
  id: { ko: 'ID', en: 'ID' } as LocalizedText,
  name: { ko: '이름', en: 'Name' } as LocalizedText,
  row: { ko: '행(층)', en: 'Row' } as LocalizedText,
  column: { ko: '열(호)', en: 'Col' } as LocalizedText,
  totalHours: { ko: '총일조(h)', en: 'Total(h)' } as LocalizedText,
  continuousHours: { ko: '연속일조(h)', en: 'Cont.(h)' } as LocalizedText,
  sunlightBar: { ko: '일조 구간', en: 'Sun Bar' } as LocalizedText,
  status: { ko: '판정', en: 'Status' } as LocalizedText,
}

type SortKey = 'id' | 'row' | 'column' | 'total_hours' | 'continuous_hours' | 'compliant'
type SortDir = 'asc' | 'desc'

// Mini sunlight bar: renders hourly_status as inline SVG color bar
function SunlightMiniBar({ hourlyStatus }: { hourlyStatus: number[] }) {
  if (!hourlyStatus || hourlyStatus.length === 0) return null
  // Filter out night (-1) entries to show only analysis window
  const activeSlots = hourlyStatus.filter((s) => s >= 0)
  if (activeSlots.length === 0) return null

  const barWidth = 80
  const barHeight = 12
  const slotWidth = barWidth / activeSlots.length

  return (
    <svg width={barWidth} height={barHeight} className="inline-block align-middle">
      {activeSlots.map((status, i) => (
        <rect
          key={i}
          x={i * slotWidth}
          y={0}
          width={slotWidth + 0.5}
          height={barHeight}
          fill={status === 1 ? '#fbbf24' : '#e5e7eb'}
        />
      ))}
      <rect x={0} y={0} width={barWidth} height={barHeight}
        fill="none" stroke="#d1d5db" strokeWidth={0.5} />
    </svg>
  )
}

interface SunlightResultsTableProps {
  points: PointSunlightResult[]
  selectedPointId?: string | null
  onPointSelect?: (id: string) => void
  groups?: MeasurementPointGroup[]
}

export default function SunlightResultsTable({
  points,
  selectedPointId,
  onPointSelect,
  groups,
}: SunlightResultsTableProps) {
  const { t } = useLocalizedText()
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filter, setFilter] = useState<'all' | 'compliant' | 'non-compliant'>('all')
  const [activeGroupTab, setActiveGroupTab] = useState<string | null>(null)

  // Build group name lookup from result points (using the name prefix [floor,unit] or group field)
  const groupNames = useMemo(() => {
    if (!groups || groups.length <= 1) return null
    return groups.map((g) => g.name)
  }, [groups])

  // Map point IDs to their group
  const pointGroupMap = useMemo(() => {
    if (!groups) return new Map<string, { groupName: string; row?: number; column?: number }>()
    const map = new Map<string, { groupName: string; row?: number; column?: number }>()
    for (const g of groups) {
      for (const pt of g.points) {
        map.set(pt.id, { groupName: g.name, row: pt.row, column: pt.column })
      }
    }
    return map
  }, [groups])

  const hasGroups = groupNames && groupNames.length > 1
  const hasRowCol = useMemo(() => {
    if (!groups) return false
    return groups.some((g) => g.sorted && g.points.some((p) => p.row != null))
  }, [groups])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // Filter by group tab
  const groupFiltered = useMemo(() => {
    if (!activeGroupTab || !hasGroups) return points
    return points.filter((p) => {
      const info = pointGroupMap.get(p.id)
      return info?.groupName === activeGroupTab
    })
  }, [points, activeGroupTab, hasGroups, pointGroupMap])

  const filtered = groupFiltered.filter((p) => {
    if (filter === 'compliant') return p.compliant
    if (filter === 'non-compliant') return !p.compliant
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'id') return mul * a.id.localeCompare(b.id)
    if (sortKey === 'row') {
      const aRow = pointGroupMap.get(a.id)?.row ?? 0
      const bRow = pointGroupMap.get(b.id)?.row ?? 0
      return mul * (aRow - bRow)
    }
    if (sortKey === 'column') {
      const aCol = pointGroupMap.get(a.id)?.column ?? 0
      const bCol = pointGroupMap.get(b.id)?.column ?? 0
      return mul * (aCol - bCol)
    }
    if (sortKey === 'total_hours') return mul * (a.total_hours - b.total_hours)
    if (sortKey === 'continuous_hours') return mul * (a.continuous_hours - b.continuous_hours)
    if (sortKey === 'compliant') return mul * (Number(a.compliant) - Number(b.compliant))
    return 0
  })

  if (!points || points.length === 0) {
    return (
      <EmptyState
        icon={FileSearch}
        title="일조 분석 결과가 없습니다"
        description="측정점이 올바르게 설정되었는지 확인하세요."
      />
    )
  }

  // Build column definitions dynamically
  const columns: { key: SortKey; label: LocalizedText }[] = [
    { key: 'id', label: txt.id },
    { key: 'id', label: txt.name },
  ]
  if (hasRowCol) {
    columns.push({ key: 'row', label: txt.row })
    columns.push({ key: 'column', label: txt.column })
  }
  columns.push(
    { key: 'total_hours', label: txt.totalHours },
    { key: 'continuous_hours', label: txt.continuousHours },
  )
  // Sunlight bar column (non-sortable, added separately)
  const hasSunlightBar = points.some((p) => p.hourly_status && p.hourly_status.length > 0)
  columns.push({ key: 'compliant', label: txt.status })

  return (
    <div className="space-y-2">
      {/* Group tabs */}
      {hasGroups && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveGroupTab(null)}
            className={`px-2.5 py-1 text-[11px] rounded-full whitespace-nowrap transition-all ${
              activeGroupTab === null
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {groupNames!.map((name) => {
            const groupPoints = points.filter((p) => pointGroupMap.get(p.id)?.groupName === name)
            const groupCompliant = groupPoints.filter((p) => p.compliant).length
            return (
              <button
                key={name}
                onClick={() => setActiveGroupTab(name)}
                className={`px-2.5 py-1 text-[11px] rounded-full whitespace-nowrap transition-all ${
                  activeGroupTab === name
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {name}
                <span className="ml-1 text-[10px] opacity-70">
                  {groupCompliant}/{groupPoints.length}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Filter buttons */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">{t(txt.title)}</h3>
        <div className="flex gap-1">
          {(['all', 'compliant', 'non-compliant'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 text-[11px] border transition-all duration-300 ${
                filter === f
                  ? 'border-red-600 text-red-600 bg-red-50'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {f === 'all' ? '전체' : f === 'compliant' ? '적합' : '부적합'}
              {f !== 'all' && (
                <span className="ml-1 text-gray-400">
                  ({f === 'compliant'
                    ? groupFiltered.filter((p) => p.compliant).length
                    : groupFiltered.filter((p) => !p.compliant).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  scope="col"
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500
                    cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    {t(col.label)}
                    <ArrowUpDown size={10} className="text-gray-400" />
                  </div>
                </th>
              ))}
              {hasSunlightBar && (
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 whitespace-nowrap">
                  {t(txt.sunlightBar)}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((point) => {
              const info = pointGroupMap.get(point.id)
              return (
                <tr
                  key={point.id}
                  onClick={() => onPointSelect?.(point.id)}
                  className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedPointId === point.id
                      ? 'bg-red-50 ring-1 ring-inset ring-red-200'
                      : !point.compliant ? 'bg-red-50/50' : ''
                  }`}
                >
                  <td className="px-3 py-2 text-gray-500 font-mono text-xs">{point.id}</td>
                  <td className="px-3 py-2 text-gray-700 text-xs">{point.name}</td>
                  {hasRowCol && (
                    <>
                      <td className="px-3 py-2 text-gray-500 text-xs tabular-nums text-center">
                        {info?.row ?? '-'}
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs tabular-nums text-center">
                        {info?.column ?? '-'}
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2 tabular-nums text-xs">
                    <span className={point.total_hours >= 4 ? 'text-green-600' : 'text-gray-700'}>
                      {point.total_hours.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2 tabular-nums text-xs">
                    <span className={point.continuous_hours >= 2 ? 'text-green-600' : 'text-gray-700'}>
                      {point.continuous_hours.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {point.compliant ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 size={12} />
                        <span className="text-[11px]">적합</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle size={12} />
                        <span className="text-[11px]">부적합</span>
                      </div>
                    )}
                  </td>
                  {hasSunlightBar && (
                    <td className="px-3 py-2">
                      <SunlightMiniBar hourlyStatus={point.hourly_status} />
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        {sorted.length}개 측정점 표시 (전체 {points.length}개)
      </p>
    </div>
  )
}
