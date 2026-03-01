'use client'

import { useState, useMemo } from 'react'
import type { PrivacyAnalysisResult, WindowSpec } from '@/lib/types/privacy'

import ThreeViewer from '@/components/shared/3d/ThreeViewer'
import GroundGrid from '@/components/shared/3d/GroundGrid'
import SceneLighting from '@/components/shared/3d/SceneLighting'
import CompassRose from '@/components/shared/3d/CompassRose'

import SightlineVisualization from './SightlineVisualization'
import WindowMarkers from './WindowMarkers'

// ─── 등급 색상 ───────────────────────────────────
const GRADE_COLORS = {
  1: '#dc2626',
  2: '#d97706',
  3: '#16a34a',
} as const

// ─── PrivacySceneOverlay ─────────────────────────

interface PrivacySceneOverlayProps {
  results: PrivacyAnalysisResult
  sceneUrl?: string | null
  selectedPairId: number | null
  onPairSelect: (id: number) => void
}

export default function PrivacySceneOverlay({
  results,
  // sceneUrl, // TODO: BuildingModel 연동 시 활성화
  selectedPairId,
  onPairSelect,
}: PrivacySceneOverlayProps) {
  const [gradeFilter, setGradeFilter] = useState<{ 1: boolean; 2: boolean; 3: boolean }>({
    1: true,
    2: true,
    3: true,
  })
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null)

  // config의 창문 목록을 pairs에서 유추
  const { observerWindows, targetWindows } = useMemo(() => {
    const observerMap = new Map<string, WindowSpec>()
    const targetMap = new Map<string, WindowSpec>()

    results.pairs.forEach((pair) => {
      if (!observerMap.has(pair.observer.id)) {
        observerMap.set(pair.observer.id, {
          id: pair.observer.id,
          x: pair.observer.coordinates.x,
          y: pair.observer.coordinates.y,
          z: pair.observer.coordinates.z,
          normal_dx: pair.observer.normal.dx,
          normal_dy: pair.observer.normal.dy,
          normal_dz: pair.observer.normal.dz,
          width: 1.0,
          height: 1.2,
          building_name: pair.observer.building_name,
          floor: pair.observer.floor,
        })
      }
      if (!targetMap.has(pair.target.id)) {
        targetMap.set(pair.target.id, {
          id: pair.target.id,
          x: pair.target.coordinates.x,
          y: pair.target.coordinates.y,
          z: pair.target.coordinates.z,
          normal_dx: pair.target.normal.dx,
          normal_dy: pair.target.normal.dy,
          normal_dz: pair.target.normal.dz,
          width: pair.target.width,
          height: pair.target.height,
          building_name: pair.target.building_name,
          floor: pair.target.floor,
        })
      }
    })

    return {
      observerWindows: Array.from(observerMap.values()),
      targetWindows: Array.from(targetMap.values()),
    }
  }, [results.pairs])

  const handleWindowClick = (id: string) => {
    setSelectedWindowId((prev) => (prev === id ? null : id))
  }

  const toggleGrade = (grade: 1 | 2 | 3) => {
    setGradeFilter((prev) => ({ ...prev, [grade]: !prev[grade] }))
  }

  // 선택된 창문의 pair 필터링
  const filteredPairs = useMemo(() => {
    if (!selectedWindowId) return results.pairs
    return results.pairs.filter(
      (p) => p.observer.id === selectedWindowId || p.target.id === selectedWindowId,
    )
  }, [results.pairs, selectedWindowId])

  return (
    <div className="relative">
      {/* 3D 뷰어 */}
      <ThreeViewer height="520px">
        <SceneLighting />
        <GroundGrid />
        <CompassRose />
        <WindowMarkers
          observerWindows={observerWindows}
          targetWindows={targetWindows}
          selectedWindowId={selectedWindowId}
          onWindowClick={handleWindowClick}
        />
        <SightlineVisualization
          pairs={filteredPairs}
          gradeFilter={gradeFilter}
          selectedPairId={selectedPairId}
          onPairSelect={onPairSelect}
        />
      </ThreeViewer>

      {/* HTML 오버레이: 등급 필터 체크박스 */}
      <div className="absolute top-3 left-3 bg-white/90 border border-gray-200 shadow-sm p-3 space-y-2 text-xs">
        <div className="font-medium text-gray-700 mb-1">등급 필터</div>
        {([1, 2, 3] as const).map((grade) => (
          <label key={grade} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={gradeFilter[grade]}
              onChange={() => toggleGrade(grade)}
              className="accent-red-600"
            />
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: GRADE_COLORS[grade] }}
            />
            <span className="text-gray-700">등급 {grade}</span>
          </label>
        ))}
      </div>

      {/* HTML 오버레이: 범례 */}
      <div className="absolute bottom-3 right-3 bg-white/90 border border-gray-200 shadow-sm p-3 text-xs space-y-1.5">
        <div className="font-medium text-gray-700 mb-1">범례</div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: '#2563eb' }} />
          <span className="text-gray-600">관찰자 창문</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: '#ea580c' }} />
          <span className="text-gray-600">대상 창문</span>
        </div>
        <hr className="border-gray-200" />
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 h-0.5" style={{ backgroundColor: GRADE_COLORS[1] }} />
          <span className="text-gray-600">등급 1 (심각)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 h-0.5" style={{ backgroundColor: GRADE_COLORS[2] }} />
          <span className="text-gray-600">등급 2 (주의)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-6 h-0.5" style={{ backgroundColor: GRADE_COLORS[3] }} />
          <span className="text-gray-600">등급 3 (양호)</span>
        </div>
        {selectedWindowId && (
          <>
            <hr className="border-gray-200" />
            <button
              onClick={() => setSelectedWindowId(null)}
              className="text-red-600 hover:text-red-700 text-xs"
            >
              창문 선택 해제
            </button>
          </>
        )}
      </div>
    </div>
  )
}
