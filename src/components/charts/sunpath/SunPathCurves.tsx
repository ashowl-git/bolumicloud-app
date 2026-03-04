import { isPointInPolygon } from './solar-position'

interface SunPathEntry {
  date: Date
  color: string
  label: string
  positions: Array<{ hour: number; alt: number; az: number; x: number; y: number }>
  hourlyMarkers: Array<{ hour: number; alt: number; az: number; x: number; y: number }>
}

interface SunPathCurvesProps {
  sunPaths: SunPathEntry[]
  obstructions?: Array<{
    points: Array<{ azimuth: number; altitude: number }>
  }>
  onHover: (point: {
    x: number
    y: number
    hour: number
    alt: number
    az: number
    dateLabel: string
  } | null) => void
}

export default function SunPathCurves({ sunPaths, obstructions, onHover }: SunPathCurvesProps) {
  const hasObstructions = obstructions && obstructions.length > 0

  return (
    <>
      {sunPaths.map((sp, si) => {
        if (sp.positions.length < 2) return null

        // Classify each position as blocked or unblocked by obstructions
        const classified = sp.positions.map((p) => ({
          ...p,
          blocked: hasObstructions
            ? obstructions!.some((obs) =>
                isPointInPolygon(
                  { azimuth: p.az, altitude: p.alt },
                  obs.points
                )
              )
            : false,
        }))

        // Split positions into contiguous segments by blocked status
        type Segment = { blocked: boolean; points: typeof classified }
        const segments: Segment[] = []
        let currentSeg: Segment | null = null

        for (const pt of classified) {
          if (!currentSeg || currentSeg.blocked !== pt.blocked) {
            // Start new segment; overlap last point for continuity
            const newSeg: Segment = { blocked: pt.blocked, points: [] }
            if (currentSeg && currentSeg.points.length > 0) {
              newSeg.points.push(currentSeg.points[currentSeg.points.length - 1])
            }
            newSeg.points.push(pt)
            segments.push(newSeg)
            currentSeg = newSeg
          } else {
            currentSeg.points.push(pt)
          }
        }

        return (
          <g key={`path-${si}`}>
            {/* Path line segments */}
            {segments.map((seg, segIdx) => {
              if (seg.points.length < 2) return null
              const segD = seg.points
                .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
                .join(' ')

              return (
                <path
                  key={`seg-${si}-${segIdx}`}
                  d={segD}
                  fill="none"
                  stroke={sp.color}
                  strokeWidth={seg.blocked ? 1.5 : 2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={seg.blocked ? '4,3' : 'none'}
                  opacity={seg.blocked ? 0.35 : 0.8}
                />
              )
            })}

            {/* Hourly markers */}
            {sp.hourlyMarkers.map((m) => {
              const isBlocked = hasObstructions
                ? obstructions!.some((obs) =>
                    isPointInPolygon(
                      { azimuth: m.az, altitude: m.alt },
                      obs.points
                    )
                  )
                : false

              return (
                <g key={`marker-${si}-${m.hour}`}>
                  <circle
                    cx={m.x}
                    cy={m.y}
                    r={4}
                    fill={isBlocked ? '#94a3b8' : sp.color}
                    stroke="white"
                    strokeWidth={1.5}
                    opacity={isBlocked ? 0.5 : 1}
                    className="cursor-pointer"
                    onMouseEnter={() =>
                      onHover({
                        x: m.x,
                        y: m.y,
                        hour: m.hour,
                        alt: m.alt,
                        az: m.az,
                        dateLabel: sp.label,
                      })
                    }
                  />
                  {/* Shadow indicator for blocked markers */}
                  {isBlocked && (
                    <line
                      x1={m.x - 3}
                      y1={m.y - 3}
                      x2={m.x + 3}
                      y2={m.y + 3}
                      stroke="#475569"
                      strokeWidth={1.5}
                      opacity={0.6}
                      className="pointer-events-none"
                    />
                  )}
                  {/* Hour label */}
                  <text
                    x={m.x}
                    y={m.y - 8}
                    textAnchor="middle"
                    className="text-[8px] fill-gray-500 pointer-events-none"
                  >
                    {Math.round(m.hour)}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}
    </>
  )
}
