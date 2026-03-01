'use client'

// ─── SunlightLegend ─────────────────────────

interface SunlightLegendProps {
  maxHours?: number
}

const GRADIENT_STOPS = [
  { pct: 0, color: '#ef4444' },
  { pct: 25, color: '#f59e0b' },
  { pct: 50, color: '#eab308' },
  { pct: 75, color: '#84cc16' },
  { pct: 100, color: '#22c55e' },
]

export default function SunlightLegend({ maxHours = 8 }: SunlightLegendProps) {
  const gradient = GRADIENT_STOPS.map((s) => `${s.color} ${s.pct}%`).join(', ')

  return (
    <div className="absolute bottom-3 right-3 z-10 bg-white/90 border border-gray-200 p-2">
      <p className="text-xs text-gray-500 mb-1">일조시간 (h)</p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 tabular-nums">0</span>
        <div
          className="w-24 h-3 rounded-sm"
          style={{ background: `linear-gradient(to right, ${gradient})` }}
        />
        <span className="text-xs text-gray-400 tabular-nums">{maxHours}</span>
      </div>
    </div>
  )
}
