'use client'

// ─── SolarPVLegend ─────────────────────────────
// 태양광 발전 분석 결과 범례.
// Surface Score 색상 그라데이션(red->yellow->green)과 총 용량/발전량 표시.

interface SolarPVLegendProps {
  totalCapacityKwp?: number
  totalAnnualMwh?: number
}

const GRADIENT_STOPS = [
  { pct: 0, color: '#ef4444' },
  { pct: 25, color: '#f59e0b' },
  { pct: 50, color: '#eab308' },
  { pct: 75, color: '#84cc16' },
  { pct: 100, color: '#22c55e' },
]

export default function SolarPVLegend({
  totalCapacityKwp,
  totalAnnualMwh,
}: SolarPVLegendProps) {
  const gradient = GRADIENT_STOPS.map((s) => `${s.color} ${s.pct}%`).join(', ')

  return (
    <div className="absolute bottom-3 right-3 z-10 bg-white/90 border border-gray-200 p-2">
      <p className="text-xs text-gray-500 mb-1">Surface Score</p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 tabular-nums">0</span>
        <div
          className="w-24 h-3 rounded-sm"
          style={{ background: `linear-gradient(to right, ${gradient})` }}
        />
        <span className="text-xs text-gray-400 tabular-nums">100</span>
      </div>

      {(totalCapacityKwp != null || totalAnnualMwh != null) && (
        <div className="mt-2 pt-1.5 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Total:{' '}
            {totalCapacityKwp != null && (
              <span className="font-medium text-gray-700 tabular-nums">
                {totalCapacityKwp.toFixed(1)} kWp
              </span>
            )}
            {totalCapacityKwp != null && totalAnnualMwh != null && ' / '}
            {totalAnnualMwh != null && (
              <span className="font-medium text-gray-700 tabular-nums">
                {totalAnnualMwh.toFixed(1)} MWh/yr
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
