'use client'

import MeasurementPoints from './MeasurementPoints'
import MeasurementAreaGrid from './MeasurementAreaGrid'
import type { MeasurementPoint, PointSunlightResult } from '@/lib/types/sunlight'

// ─── SunlightHeatmapOverlay ─────────────────
// 분석 결과를 3D 뷰에 통합 표시:
//   MeasurementAreaGrid  → 지면 색상 셀 (일조시간 그라데이션)
//   MeasurementPoints    → 마커 구체 (적합/부적합 색상)

interface SunlightHeatmapOverlayProps {
  points: MeasurementPoint[]
  results: PointSunlightResult[]
  selectedPointId: string | null
  onPointClick: (id: string) => void
}

export default function SunlightHeatmapOverlay({
  points,
  results,
  selectedPointId,
  onPointClick,
}: SunlightHeatmapOverlayProps) {
  if (results.length === 0) return null

  return (
    <group>
      <MeasurementAreaGrid
        results={results}
        selectedPointId={selectedPointId}
      />
      <MeasurementPoints
        points={points}
        results={results}
        selectedPointId={selectedPointId}
        mode="view"
        onPointClick={onPointClick}
      />
    </group>
  )
}
