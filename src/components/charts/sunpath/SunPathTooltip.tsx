interface HoveredPoint {
  x: number
  y: number
  hour: number
  alt: number
  az: number
  dateLabel: string
}

interface SunPathTooltipProps {
  hovered: HoveredPoint | null
  svgSize: number
}

export default function SunPathTooltip({ hovered, svgSize }: SunPathTooltipProps) {
  if (!hovered) return null

  return (
    <g>
      <rect
        x={Math.min(hovered.x + 12, svgSize - 170)}
        y={Math.max(hovered.y - 50, 4)}
        width={158}
        height={48}
        rx={2}
        fill="white"
        stroke="#d1d5db"
        strokeWidth={0.5}
        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.05))"
      />
      <text
        x={Math.min(hovered.x + 18, svgSize - 164)}
        y={Math.max(hovered.y - 34, 18)}
        className="text-[10px] fill-gray-900 font-medium"
      >
        {hovered.dateLabel} | {Math.floor(hovered.hour)}:
        {String(Math.round((hovered.hour % 1) * 60)).padStart(2, '0')}
      </text>
      <text
        x={Math.min(hovered.x + 18, svgSize - 164)}
        y={Math.max(hovered.y - 18, 34)}
        className="text-[10px] fill-gray-500"
      >
        Alt: {hovered.alt.toFixed(1)} | Az: {hovered.az.toFixed(1)}
      </text>
    </g>
  )
}
