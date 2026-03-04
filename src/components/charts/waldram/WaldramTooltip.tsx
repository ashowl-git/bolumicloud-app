interface HoveredPoint {
  x: number
  y: number
  az: number
  alt: number
  name?: string
}

interface WaldramTooltipProps {
  hoveredPoint: HoveredPoint | null
  editable: boolean
}

export default function WaldramTooltip({ hoveredPoint, editable }: WaldramTooltipProps) {
  if (!hoveredPoint || editable) return null

  return (
    <g>
      <rect
        x={hoveredPoint.x + 10}
        y={hoveredPoint.y - 36}
        width={160}
        height={hoveredPoint.name ? 42 : 28}
        rx={2}
        fill="white"
        stroke="#d1d5db"
        strokeWidth={0.5}
        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.05))"
      />
      {hoveredPoint.name && (
        <text
          x={hoveredPoint.x + 16}
          y={hoveredPoint.y - 22}
          className="text-[10px] fill-gray-900 font-medium"
        >
          {hoveredPoint.name}
        </text>
      )}
      <text
        x={hoveredPoint.x + 16}
        y={hoveredPoint.name ? hoveredPoint.y - 6 : hoveredPoint.y - 16}
        className="text-[10px] fill-gray-500"
      >
        Az: {hoveredPoint.az.toFixed(1)} | Alt: {hoveredPoint.alt.toFixed(1)}
      </text>
    </g>
  )
}
