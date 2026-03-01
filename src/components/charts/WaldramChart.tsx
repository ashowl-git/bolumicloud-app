'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ObstructionPolygon {
  name: string
  points: Array<{ azimuth: number; altitude: number }>
  color?: string
}

export interface WaldramChartProps {
  obstructions: ObstructionPolygon[]
  viewpoint?: { lat: number; lng: number }
  width?: number
  height?: number
}

// ---------------------------------------------------------------------------
// Waldram projection helpers
//
// The Waldram diagram is an equal-solid-angle projection of the sky
// hemisphere onto a 2D rectangular chart.
//
// X-axis: azimuth angle (theta), mapped linearly.
// Y-axis: Waldram ordinate = (1/2) * sin(2 * altitude)
//         which equals sin(altitude) * cos(altitude).
//
// This ensures that equal rectangular areas on the chart correspond to
// equal solid angles on the sky hemisphere, so the ratio of an
// obstruction area to the total chart area directly gives the fraction
// of the sky hemisphere that is blocked.
//
// Total Waldram area for a full hemisphere:
//   integral from alt=0..pi/2 of sin(2*alt)/2 d(alt) * (azimuth range)
//   = 0.5 * (azimuth range in radians)
//
// For the standard 180-degree forward view (azimuth -90..+90):
//   total area = 0.5 * pi  (in normalised units)
// ---------------------------------------------------------------------------

const DEG = Math.PI / 180

/** Convert altitude (degrees) to Waldram y coordinate (0..0.5). */
function waldramY(altDeg: number): number {
  const alt = altDeg * DEG
  return 0.5 * Math.sin(2 * alt)
}

// ---------------------------------------------------------------------------
// Default palette for obstructions
// ---------------------------------------------------------------------------

const PALETTE = [
  '#64748b', // slate-500
  '#6366f1', // indigo-500
  '#0ea5e9', // sky-500
  '#14b8a6', // teal-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WaldramChart({
  obstructions,
  viewpoint,
  width: propWidth,
  height: propHeight,
}: WaldramChartProps) {
  // ---- responsive sizing ------------------------------------------------
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  const svgWidth = propWidth ?? (containerWidth > 0 ? containerWidth : 640)
  const svgHeight = propHeight ?? Math.round(svgWidth * 0.5)

  // ---- layout constants --------------------------------------------------
  const margin = { top: 28, right: 24, bottom: 36, left: 48 }
  const plotW = svgWidth - margin.left - margin.right
  const plotH = svgHeight - margin.top - margin.bottom

  // Azimuth range: -90..+90 degrees (forward hemisphere)
  const azMin = -90
  const azMax = 90
  // Waldram y range: 0..0.5
  const wyMax = 0.5

  // ---- coordinate transforms --------------------------------------------
  const toSvgX = useCallback(
    (azDeg: number) => margin.left + ((azDeg - azMin) / (azMax - azMin)) * plotW,
    [plotW, margin.left]
  )
  const toSvgY = useCallback(
    (wy: number) => margin.top + plotH - (wy / wyMax) * plotH,
    [plotH, margin.top]
  )

  // ---- projected obstruction polygons ------------------------------------
  const projectedObstructions = useMemo(
    () =>
      obstructions.map((obs, idx) => {
        const svgPoints = obs.points.map((p) => {
          const sx = toSvgX(p.azimuth)
          const sy = toSvgY(waldramY(p.altitude))
          return { sx, sy, az: p.azimuth, alt: p.altitude }
        })
        return {
          ...obs,
          svgPoints,
          color: obs.color ?? PALETTE[idx % PALETTE.length],
        }
      }),
    [obstructions, toSvgX, toSvgY]
  )

  // ---- SVF calculation ---------------------------------------------------
  // Sky Visibility Factor = 1 - (blocked solid angle / total hemisphere solid angle)
  // On the Waldram chart, blocked area / total chart area = blocked fraction.
  // We compute polygon area using the shoelace formula on Waldram coordinates.
  const { svf, blockedFraction } = useMemo(() => {
    const totalArea = (azMax - azMin) * DEG * wyMax // pi/2 * 0.5

    let totalBlocked = 0
    for (const obs of obstructions) {
      // Shoelace formula in Waldram coordinate space
      const pts = obs.points.map((p) => ({
        x: p.azimuth * DEG,
        y: waldramY(p.altitude),
      }))
      let area = 0
      for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length
        area += pts[i].x * pts[j].y - pts[j].x * pts[i].y
      }
      totalBlocked += Math.abs(area) / 2
    }

    const frac = Math.min(totalBlocked / totalArea, 1)
    return { svf: 1 - frac, blockedFraction: frac }
  }, [obstructions])

  // ---- interaction state -------------------------------------------------
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number
    y: number
    az: number
    alt: number
    name?: string
  } | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  // ---- grid lines --------------------------------------------------------
  const altitudeLines = [10, 20, 30, 40, 50, 60, 70, 80, 90]
  const azimuthLines = [-90, -60, -30, 0, 30, 60, 90]

  return (
    <div ref={containerRef} className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Waldram Diagram</h3>
          {viewpoint && (
            <p className="text-xs text-gray-500 mt-0.5">
              ({viewpoint.lat.toFixed(4)}, {viewpoint.lng.toFixed(4)})
            </p>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span>
            SVF: <strong className="text-gray-900">{(svf * 100).toFixed(1)}%</strong>
          </span>
          <span>
            Blocked: <strong className="text-gray-900">{(blockedFraction * 100).toFixed(1)}%</strong>
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <svg
        width={svgWidth}
        height={svgHeight}
        className="border border-gray-200 bg-white select-none"
        onMouseLeave={() => setHoveredPoint(null)}
      >
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

        {/* Obstruction polygons */}
        {projectedObstructions.map((obs, idx) => {
          const pointsStr = obs.svgPoints.map((p) => `${p.sx},${p.sy}`).join(' ')
          const isSelected = selectedIdx === idx
          return (
            <g key={obs.name + idx}>
              <polygon
                points={pointsStr}
                fill={obs.color}
                fillOpacity={isSelected ? 0.5 : 0.3}
                stroke={obs.color}
                strokeWidth={isSelected ? 2 : 1}
                strokeLinejoin="round"
                className="cursor-pointer transition-opacity duration-200"
                onClick={() => setSelectedIdx(isSelected ? null : idx)}
                onMouseMove={(e) => {
                  const svg = e.currentTarget.ownerSVGElement
                  if (!svg) return
                  const pt = svg.createSVGPoint()
                  pt.x = e.clientX
                  pt.y = e.clientY
                  const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
                  // Reverse-map to azimuth/altitude
                  const azDeg =
                    azMin + ((svgP.x - margin.left) / plotW) * (azMax - azMin)
                  const wyNorm =
                    ((margin.top + plotH - svgP.y) / plotH) * wyMax
                  // Invert waldramY: wy = 0.5*sin(2*alt) -> alt = 0.5*asin(2*wy)
                  const altDeg =
                    (0.5 * Math.asin(Math.min(2 * wyNorm, 1))) / DEG
                  setHoveredPoint({
                    x: svgP.x,
                    y: svgP.y,
                    az: azDeg,
                    alt: altDeg,
                    name: obs.name,
                  })
                }}
              />
              {/* Polygon vertices */}
              {obs.svgPoints.map((p, pi) => (
                <circle
                  key={pi}
                  cx={p.sx}
                  cy={p.sy}
                  r={isSelected ? 4 : 2.5}
                  fill={obs.color}
                  stroke="white"
                  strokeWidth={1}
                />
              ))}
            </g>
          )
        })}

        {/* Hover tooltip */}
        {hoveredPoint && (
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
        )}
      </svg>

      {/* Legend */}
      {obstructions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {projectedObstructions.map((obs, idx) => (
            <button
              key={obs.name + idx}
              type="button"
              onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
              className={`flex items-center gap-1.5 px-2 py-1 text-xs border transition-all duration-200 ${
                selectedIdx === idx
                  ? 'border-gray-400 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span
                className="w-3 h-3 inline-block"
                style={{ backgroundColor: obs.color, opacity: 0.6 }}
              />
              <span className="text-gray-700">{obs.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Info note */}
      <div className="mt-2 flex items-start gap-1.5 text-[10px] text-gray-400">
        <Info size={12} className="mt-0.5 shrink-0" />
        <span>
          Waldram equal-solid-angle projection. Each unit area on the chart
          corresponds to an equal solid angle of the sky hemisphere.
          SVF = Sky Visibility Factor (unobstructed sky fraction).
        </span>
      </div>
    </div>
  )
}
