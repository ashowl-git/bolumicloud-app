'use client'

import { useMemo } from 'react'
import { AlertTriangle, Building2 } from 'lucide-react'
import type { CauseAnalysisResult } from '@/lib/types/sunlight'

// ─── CauseAnalysisView ──────────────────────

interface CauseAnalysisViewProps {
  causeResult: CauseAnalysisResult
  selectedBuildingId: string | null
  onBuildingSelect: (id: string | null) => void
}

export default function CauseAnalysisView({
  causeResult,
  selectedBuildingId,
  onBuildingSelect,
}: CauseAnalysisViewProps) {
  // 고유 블로커 건물 목록 (총 차단 시간으로 정렬)
  const rankedBuildings = useMemo(() => {
    const buildingMap = new Map<string, {
      building_id: string
      total_shadow_minutes: number
      affected_points: number
      bbox_min: [number, number, number]
      bbox_max: [number, number, number]
    }>()

    for (const pc of causeResult.point_causes) {
      for (const blocker of pc.blockers) {
        const existing = buildingMap.get(blocker.building_id)
        if (existing) {
          existing.total_shadow_minutes += blocker.shadow_minutes
          existing.affected_points += 1
        } else {
          buildingMap.set(blocker.building_id, {
            building_id: blocker.building_id,
            total_shadow_minutes: blocker.shadow_minutes,
            affected_points: 1,
            bbox_min: blocker.bbox_min,
            bbox_max: blocker.bbox_max,
          })
        }
      }
    }

    return Array.from(buildingMap.values())
      .sort((a, b) => b.total_shadow_minutes - a.total_shadow_minutes)
  }, [causeResult.point_causes])

  if (causeResult.total_non_compliant === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* 요약 카드 */}
      <div className="border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={18} className="text-red-600" />
          <h3 className="text-sm font-medium text-gray-900">원인 분석</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">부적합 측정점</p>
            <p className="text-2xl font-light text-red-600">
              {causeResult.total_non_compliant}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">원인 건물 수</p>
            <p className="text-2xl font-light text-gray-900">
              {rankedBuildings.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">전체 건물 수</p>
            <p className="text-2xl font-light text-gray-900">
              {causeResult.buildings.length}
            </p>
          </div>
        </div>
      </div>

      {/* 원인 건물 테이블 */}
      {rankedBuildings.length > 0 && (
        <div className="border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">건물</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">높이</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">총 차단(분)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">영향 측정점</th>
              </tr>
            </thead>
            <tbody>
              {rankedBuildings.map((building) => {
                const bldgInfo = causeResult.buildings.find(
                  (b) => b.building_id === building.building_id,
                )
                return (
                  <tr
                    key={building.building_id}
                    onClick={() => onBuildingSelect(
                      selectedBuildingId === building.building_id ? null : building.building_id,
                    )}
                    className={`border-b border-gray-100 cursor-pointer transition-colors ${
                      selectedBuildingId === building.building_id
                        ? 'bg-red-50 ring-1 ring-inset ring-red-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-gray-400" />
                        <span className="text-gray-700 font-mono text-xs">
                          {building.building_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-700">
                      {bldgInfo ? `${bldgInfo.height.toFixed(1)}m` : '-'}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-red-600">
                      {building.total_shadow_minutes}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-700">
                      {building.affected_points}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 측정점별 상세 */}
      <details className="border border-gray-200">
        <summary className="px-4 py-3 text-sm text-gray-700 cursor-pointer hover:bg-gray-50">
          측정점별 차단 상세 ({causeResult.point_causes.length}개)
        </summary>
        <div className="border-t border-gray-200 divide-y divide-gray-100">
          {causeResult.point_causes.map((pc) => (
            <div key={pc.point_id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{pc.point_name}</span>
                <span className="text-xs text-red-600">
                  총일조 {pc.total_hours.toFixed(1)}h | 연속 {pc.continuous_hours.toFixed(1)}h
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {pc.blockers.map((b) => (
                  <span
                    key={b.building_id}
                    className="text-xs px-2 py-1 bg-red-50 border border-red-200 text-red-700"
                  >
                    {b.building_id}: {b.shadow_minutes}분 ({b.shadow_percentage}%)
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
