'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'
import { useResizeObserver } from '@/hooks/useResizeObserver'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ObstructionPolygon {
  name: string
  points: Array<{ azimuth: number; altitude: number }>
  color?: string
}

export interface SunPathData {
  label: string
  date: string
  positions: Array<{ hour: number; altitude: number; azimuth: number }>
  color?: string
}

export interface WaldramChartProps {
  obstructions: ObstructionPolygon[]
  viewpoint?: { lat: number; lng: number }
  width?: number
  height?: number
  sunPaths?: SunPathData[]
  editable?: boolean
  onObstructionsChange?: (obstructions: ObstructionPolygon[]) => void
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

// Default sun path colors for up to 4 dates
const SUN_PATH_PALETTE = [
  '#22c55e', // green
  '#ef4444', // red
  '#f59e0b', // amber
  '#3b82f6', // blue
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WaldramChart({
  obstructions: obstructionsProp,
  viewpoint,
  width: propWidth,
  height: propHeight,
  sunPaths,
  editable = false,
  onObstructionsChange,
}: WaldramChartProps) {
  // ---- responsive sizing ------------------------------------------------
  const containerRef = useRef<HTMLDivElement>(null)
  const { width: containerWidth } = useResizeObserver(containerRef)

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

  // Reverse-map SVG coords to azimuth/altitude
  const fromSvgCoords = useCallback(
    (svgX: number, svgY: number) => {
      const azDeg = azMin + ((svgX - margin.left) / plotW) * (azMax - azMin)
      const wyNorm = ((margin.top + plotH - svgY) / plotH) * wyMax
      const altDeg = (0.5 * Math.asin(Math.min(Math.max(2 * wyNorm, -1), 1))) / DEG
      return { azDeg, altDeg }
    },
    [plotW, plotH, margin.left, margin.top]
  )

  // ---- editable state ---------------------------------------------------
  const [internalObstructions, setInternalObstructions] = useState<ObstructionPolygon[]>(obstructionsProp)

  // Keep internal state in sync when prop changes from outside
  useEffect(() => {
    setInternalObstructions(obstructionsProp)
  }, [obstructionsProp])

  const obstructions = editable ? internalObstructions : obstructionsProp

  // Update obstructions and notify parent
  const updateObstructions = useCallback(
    (next: ObstructionPolygon[]) => {
      setInternalObstructions(next)
      onObstructionsChange?.(next)
    },
    [onObstructionsChange]
  )

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<Array<{ azimuth: number; altitude: number }>>([])

  // Vertex dragging state
  const [dragging, setDragging] = useState<{ obsIdx: number; vertexIdx: number } | null>(null)

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

  // ---- sun path projected points ----------------------------------------
  const projectedSunPaths = useMemo(() => {
    if (!sunPaths) return []
    return sunPaths.map((sp, idx) => {
      const color = sp.color ?? SUN_PATH_PALETTE[idx % SUN_PATH_PALETTE.length]
      // Filter to positions within the chart azimuth range
      const visiblePositions = sp.positions.filter(
        (p) => p.azimuth >= azMin && p.azimuth <= azMax && p.altitude >= 0
      )
      const svgPoints = visiblePositions.map((p) => ({
        sx: toSvgX(p.azimuth),
        sy: toSvgY(waldramY(p.altitude)),
        hour: p.hour,
        altitude: p.altitude,
        azimuth: p.azimuth,
      }))
      // Build SVG path data string from consecutive points
      let pathD = ''
      if (svgPoints.length > 0) {
        pathD = svgPoints
          .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.sx.toFixed(2)} ${pt.sy.toFixed(2)}`)
          .join(' ')
      }
      return { ...sp, color, svgPoints, pathD }
    })
  }, [sunPaths, toSvgX, toSvgY])

  // ---- SVG mouse event helpers ------------------------------------------
  const getSvgPoint = useCallback(
    (e: React.MouseEvent<SVGSVGElement>): { svgX: number; svgY: number } | null => {
      const svg = e.currentTarget
      const pt = svg.createSVGPoint()
      pt.x = e.clientX
      pt.y = e.clientY
      const ctm = svg.getScreenCTM()
      if (!ctm) return null
      const svgP = pt.matrixTransform(ctm.inverse())
      return { svgX: svgP.x, svgY: svgP.y }
    },
    []
  )

  const isInsidePlot = useCallback(
    (svgX: number, svgY: number) =>
      svgX >= margin.left &&
      svgX <= margin.left + plotW &&
      svgY >= margin.top &&
      svgY <= margin.top + plotH,
    [plotW, plotH, margin.left, margin.top]
  )

  // ---- Keyboard handler for Escape (cancel drawing) ---------------------
  useEffect(() => {
    if (!editable) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawing) {
        setIsDrawing(false)
        setCurrentPoints([])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editable, isDrawing])

  // ---- SVG event handlers (editable mode) --------------------------------
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!editable) return
      // Right-click is handled by onContextMenu
      if (e.button !== 0) return
      const coords = getSvgPoint(e)
      if (!coords) return
      if (!isInsidePlot(coords.svgX, coords.svgY)) return

      const { azDeg, altDeg } = fromSvgCoords(coords.svgX, coords.svgY)
      const clampedAlt = Math.max(0, Math.min(90, altDeg))

      setIsDrawing(true)
      setCurrentPoints((prev) => [
        ...prev,
        { azimuth: azDeg, altitude: clampedAlt },
      ])
    },
    [editable, getSvgPoint, isInsidePlot, fromSvgCoords]
  )

  const handleSvgContextMenu = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!editable || !isDrawing) return
      e.preventDefault()
      // Complete/close the polygon if it has at least 3 points
      if (currentPoints.length >= 3) {
        const newObs: ObstructionPolygon = {
          name: `Obstruction ${obstructions.length + 1}`,
          points: currentPoints,
        }
        updateObstructions([...obstructions, newObs])
      }
      setIsDrawing(false)
      setCurrentPoints([])
    },
    [editable, isDrawing, currentPoints, obstructions, updateObstructions]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const coords = getSvgPoint(e)
      if (!coords) return

      // Handle vertex dragging
      if (dragging && editable) {
        const { azDeg, altDeg } = fromSvgCoords(coords.svgX, coords.svgY)
        const clampedAlt = Math.max(0, Math.min(90, altDeg))
        const next = obstructions.map((obs, oIdx) => {
          if (oIdx !== dragging.obsIdx) return obs
          const newPoints = obs.points.map((pt, vIdx) => {
            if (vIdx !== dragging.vertexIdx) return pt
            return { azimuth: azDeg, altitude: clampedAlt }
          })
          return { ...obs, points: newPoints }
        })
        updateObstructions(next)
        return
      }

      // Hover tooltip (existing behavior, non-edit mode)
      if (!editable && isInsidePlot(coords.svgX, coords.svgY)) {
        const { azDeg, altDeg } = fromSvgCoords(coords.svgX, coords.svgY)
        setHoveredPoint({
          x: coords.svgX,
          y: coords.svgY,
          az: azDeg,
          alt: altDeg,
        })
      }
    },
    [dragging, editable, obstructions, updateObstructions, getSvgPoint, fromSvgCoords, isInsidePlot]
  )

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  const handleVertexMouseDown = useCallback(
    (obsIdx: number, vertexIdx: number, e: React.MouseEvent) => {
      if (!editable) return
      e.stopPropagation()
      e.preventDefault()
      setDragging({ obsIdx, vertexIdx })
    },
    [editable]
  )

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
          {editable && (
            <span className="text-amber-600 font-medium">
              {isDrawing
                ? `Drawing (${currentPoints.length} pts) | Right-click to close | Esc to cancel`
                : 'Click to start polygon'}
            </span>
          )}
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
        style={{ cursor: editable ? 'crosshair' : 'default' }}
        onMouseLeave={() => {
          setHoveredPoint(null)
          if (dragging) setDragging(null)
        }}
        onClick={handleSvgClick}
        onContextMenu={handleSvgContextMenu}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
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

        {/* Sun path curves - rendered after grid lines, before obstructions */}
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
                className={editable ? 'cursor-move' : 'cursor-pointer transition-opacity duration-200'}
                onClick={
                  !editable
                    ? () => setSelectedIdx(isSelected ? null : idx)
                    : undefined
                }
                onMouseMove={
                  !editable
                    ? (e) => {
                        const svg = e.currentTarget.ownerSVGElement
                        if (!svg) return
                        const pt = svg.createSVGPoint()
                        pt.x = e.clientX
                        pt.y = e.clientY
                        const ctm = svg.getScreenCTM()
                        if (!ctm) return
                        const svgP = pt.matrixTransform(ctm.inverse())
                        const coords = fromSvgCoords(svgP.x, svgP.y)
                        if (coords.altDeg < 0 || coords.altDeg > 90) return
                        setHoveredPoint({
                          x: svgP.x,
                          y: svgP.y,
                          az: coords.azDeg,
                          alt: coords.altDeg,
                          name: obs.name,
                        })
                      }
                    : undefined
                }
              />
              {/* Polygon vertices */}
              {obs.svgPoints.map((p, pi) => (
                <circle
                  key={pi}
                  cx={p.sx}
                  cy={p.sy}
                  r={editable ? 5 : isSelected ? 4 : 2.5}
                  fill={obs.color}
                  stroke="white"
                  strokeWidth={1}
                  style={{ cursor: editable ? 'grab' : 'default' }}
                  onMouseDown={
                    editable
                      ? (e) => handleVertexMouseDown(idx, pi, e)
                      : undefined
                  }
                />
              ))}
            </g>
          )
        })}

        {/* Current polygon being drawn (editable mode) */}
        {editable && isDrawing && currentPoints.length > 0 && (
          <g>
            {/* Lines connecting the in-progress vertices */}
            {currentPoints.length > 1 && (
              <polyline
                points={currentPoints
                  .map((p) => `${toSvgX(p.azimuth).toFixed(2)},${toSvgY(waldramY(p.altitude)).toFixed(2)}`)
                  .join(' ')}
                fill="none"
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                strokeLinejoin="round"
              />
            )}
            {/* Vertex dots */}
            {currentPoints.map((p, pi) => (
              <circle
                key={`drawing-pt-${pi}`}
                cx={toSvgX(p.azimuth)}
                cy={toSvgY(waldramY(p.altitude))}
                r={4}
                fill="#6366f1"
                stroke="white"
                strokeWidth={1}
              />
            ))}
          </g>
        )}

        {/* Hover tooltip */}
        {hoveredPoint && !editable && (
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
      {(obstructions.length > 0 || (sunPaths && sunPaths.length > 0)) && (
        <div className="mt-3 flex flex-wrap gap-3">
          {projectedObstructions.map((obs, idx) => (
            <button
              key={obs.name + idx}
              type="button"
              onClick={() => !editable && setSelectedIdx(selectedIdx === idx ? null : idx)}
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
          {projectedSunPaths.map((sp, idx) => (
            <div
              key={`sp-legend-${sp.date}-${idx}`}
              className="flex items-center gap-1.5 px-2 py-1 text-xs border border-gray-200"
            >
              <span
                className="w-6 h-0.5 inline-block"
                style={{ backgroundColor: sp.color }}
              />
              <span className="text-gray-700">{sp.label}</span>
            </div>
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
          {editable && ' Click to add vertices; right-click to close polygon; Escape to cancel.'}
        </span>
      </div>
    </div>
  )
}
