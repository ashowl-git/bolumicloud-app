import { DEG, stereoR } from './solar-position'
import { ALTITUDE_CIRCLES, AZIMUTH_DIRECTIONS } from './defaults'

interface SunPathGridProps {
  cx: number
  cy: number
  radius: number
}

export default function SunPathGrid({ cx, cy, radius }: SunPathGridProps) {
  return (
    <>
      {/* Horizon circle (outermost, alt=0) */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="#f8fafc"
        stroke="#94a3b8"
        strokeWidth={1.5}
      />

      {/* Altitude circles */}
      {ALTITUDE_CIRCLES.map((alt) => {
        const r = stereoR(alt) * radius
        return (
          <g key={`alt-${alt}`}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={0.5}
              strokeDasharray={alt % 30 === 0 ? 'none' : '3,3'}
            />
            {/* Label on east side */}
            <text
              x={cx + r + 3}
              y={cy - 2}
              className="text-[9px] fill-gray-400"
            >
              {alt}
            </text>
          </g>
        )
      })}

      {/* Azimuth radial lines */}
      {AZIMUTH_DIRECTIONS.map(({ deg, label }) => {
        const theta = (deg - 90) * DEG
        const x2 = cx + radius * Math.cos(theta)
        const y2 = cy + radius * Math.sin(theta)
        const lx = cx + (radius + 16) * Math.cos(theta)
        const ly = cy + (radius + 16) * Math.sin(theta)
        return (
          <g key={`az-${deg}`}>
            <line
              x1={cx}
              y1={cy}
              x2={x2}
              y2={y2}
              stroke="#e2e8f0"
              strokeWidth={deg % 90 === 0 ? 1 : 0.5}
            />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`fill-gray-500 ${
                deg % 90 === 0 ? 'text-[12px] font-medium' : 'text-[10px]'
              }`}
            >
              {label}
            </text>
          </g>
        )
      })}

      {/* Zenith marker */}
      <circle cx={cx} cy={cy} r={2} fill="#94a3b8" />
    </>
  )
}
