interface ProjectedSunPath {
  date: string
  label: string
  color: string
  pathD: string
  svgPoints: Array<{
    sx: number
    sy: number
    hour: number
    altitude: number
    azimuth: number
  }>
}

interface WaldramSunPathsProps {
  projectedSunPaths: ProjectedSunPath[]
}

export default function WaldramSunPaths({ projectedSunPaths }: WaldramSunPathsProps) {
  return (
    <>
      {projectedSunPaths.map((sp, spIdx) => (
        <g key={`sunpath-${sp.date}-${spIdx}`}>
          {/* Path line */}
          {sp.pathD && (
            <path
              d={sp.pathD}
              fill="none"
              stroke={sp.color}
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.8}
            />
          )}
          {/* Hourly markers */}
          {sp.svgPoints.map((pt, ptIdx) => {
            // Show markers on integer hours only
            const isWholeHour = Number.isInteger(pt.hour)
            if (!isWholeHour) return null
            return (
              <g key={`sp-${spIdx}-pt-${ptIdx}`}>
                <circle
                  cx={pt.sx}
                  cy={pt.sy}
                  r={3}
                  fill={sp.color}
                  stroke="white"
                  strokeWidth={1}
                  opacity={0.9}
                />
                <text
                  x={pt.sx + 4}
                  y={pt.sy - 4}
                  fontSize={9}
                  fill={sp.color}
                  opacity={0.9}
                >
                  {pt.hour}h
                </text>
              </g>
            )
          })}
        </g>
      ))}
    </>
  )
}
