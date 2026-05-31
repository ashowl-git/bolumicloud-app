'use client'

interface ContourLegendProps {
  showTotal?: boolean
  showContinuous?: boolean
  showShadow?: boolean
  onToggleTotal?: () => void
  onToggleContinuous?: () => void
  onToggleShadow?: () => void
}

export default function ContourLegend({
  showTotal = true,
  showContinuous = true,
  showShadow = false,
  onToggleTotal,
  onToggleContinuous,
  onToggleShadow,
}: ContourLegendProps) {
  const items = [
    { label: '총일조 등시간선', color: '#ef4444', levels: '1, 2, 3, 4h', visible: showTotal, onToggle: onToggleTotal },
    { label: '연속일조 등시간선', color: '#22c55e', levels: '1, 2h', visible: showContinuous, onToggle: onToggleContinuous },
    { label: '일영곡선', color: '#3b82f6', levels: '시간별', visible: showShadow, onToggle: onToggleShadow },
  ]

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-2 shadow-md text-xs">
      <div className="font-medium text-gray-700 mb-1.5">등시간선</div>
      <div className="space-y-1">
        {items.map((item) => (
          <label key={item.label} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={item.visible}
              onChange={item.onToggle}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-3 h-3"
            />
            <span
              className="w-4 h-0.5 rounded-full inline-block"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-600">{item.label}</span>
            <span className="text-gray-400 ml-auto">{item.levels}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
