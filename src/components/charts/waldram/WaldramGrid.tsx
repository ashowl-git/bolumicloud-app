import { waldramY } from './projection'

interface WaldramGridProps {
  margin: { top: number; right: number; bottom: number; left: number }
  plotW: number
  plotH: number
  svgWidth: number
  svgHeight: number
  toSvgX: (azDeg: number) => number
  toSvgY: (wy: number) => number
}

const altitudeLines = [10, 20, 30, 40, 50, 60, 70, 80, 90]
const azimuthLines = [-90, -60, -30, 0, 30, 60, 90]

export default function WaldramGrid({
  margin,
  plotW,
  plotH,
  svgWidth,
  svgHeight,
  toSvgX,
  toSvgY,
}: WaldramGridProps) {
  return (
    <>
      {/* Background fill for sky area */}
      <rect
        x={margin.left}
        y={margin.top}
        width={plotW}
        height={plotH}
        fill="#f0f9ff"
      />

      {/* Altitude grid lines (horizontal) */}
      {altitudeLines.map((alt) => {
        const y = toSvgY(waldramY(alt))
        return (
          <g key={`alt-${alt}`}>
            <line
              x1={margin.left}
              y1={y}
              x2={margin.left + plotW}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth={alt % 30 === 0 ? 1 : 0.5}
            />
            <text
              x={margin.left - 6}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              className="text-[10px] fill-gray-400"
            >
              {alt}
            </text>
          </g>
        )
      })}

      {/* Azimuth grid lines (vertical) */}
      {azimuthLines.map((az) => {
        const x = toSvgX(az)
        return (
          <g key={`az-${az}`}>
            <line
              x1={x}
              y1={margin.top}
              x2={x}
              y2={margin.top + plotH}
              stroke="#e2e8f0"
              strokeWidth={az === 0 ? 1.5 : az % 30 === 0 ? 1 : 0.5}
            />
            <text
              x={x}
              y={margin.top + plotH + 14}
              textAnchor="middle"
              className="text-[10px] fill-gray-400"
            >
              {az > 0 ? `+${az}` : az}
            </text>
          </g>
        )
      })}

      {/* Axis labels */}
      <text
        x={margin.left + plotW / 2}
        y={svgHeight - 4}
        textAnchor="middle"
        className="text-[11px] fill-gray-500 font-medium"
      >
        Azimuth (deg)
      </text>
      <text
        x={12}
        y={margin.top + plotH / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        transform={`rotate(-90, 12, ${margin.top + plotH / 2})`}
        className="text-[11px] fill-gray-500 font-medium"
      >
        Altitude (deg)
      </text>
    </>
  )
}
