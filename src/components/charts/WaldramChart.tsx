'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import { DEG, waldramY, PALETTE, SUN_PATH_PALETTE } from './waldram/projection'
import WaldramGrid from './waldram/WaldramGrid'
import WaldramObstructions from './waldram/WaldramObstructions'
import WaldramSunPaths from './waldram/WaldramSunPaths'
import WaldramTooltip from './waldram/WaldramTooltip'
import WaldramLegend from './waldram/WaldramLegend'

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

  useEffect(() => {
    setInternalObstructions(obstructionsProp)
  }, [obstructionsProp])

  const obstructions = editable ? internalObstructions : obstructionsProp

  const updateObstructions = useCallback(
    (next: ObstructionPolygon[]) => {
      setInternalObstructions(next)
      onObstructionsChange?.(next)
    },
    [onObstructionsChange]
  )

  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<Array<{ azimuth: number; altitude: number }>>([])
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
  const { svf, blockedFraction } = useMemo(() => {
    const totalArea = (azMax - azMin) * DEG * wyMax

    let totalBlocked = 0
    for (const obs of obstructions) {
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
    x: number; y: number; az: number; alt: number; name?: string
  } | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  // ---- sun path projected points ----------------------------------------
  const projectedSunPaths = useMemo(() => {
    if (!sunPaths) return []
    return sunPaths.map((sp, idx) => {
      const color = sp.color ?? SUN_PATH_PALETTE[idx % SUN_PATH_PALETTE.length]
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
      let pathD = ''
      if (svgPoints.length > 0) {
        pathD = svgPoints
          .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.sx.toFixed(2)} ${pt.sy.toFixed(2)}`)
          .join(' ')
      }
      return { ...sp, color, svgPoints, pathD }
    })
  }, [sunPaths, toSvgX, toSvgY])

  // ---- SVG mouse helpers -------------------------------------------------
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

  // ---- Keyboard handler for Escape --------------------------------------
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

  // ---- SVG event handlers ------------------------------------------------
  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!editable) return
      if (e.button !== 0) return
      const coords = getSvgPoint(e)
      if (!coords) return
      if (!isInsidePlot(coords.svgX, coords.svgY)) return

      const { azDeg, altDeg } = fromSvgCoords(coords.svgX, coords.svgY)
      const clampedAlt = Math.max(0, Math.min(90, altDeg))

      setIsDrawing(true)
      setCurrentPoints((prev) => [...prev, { azimuth: azDeg, altitude: clampedAlt }])
    },
    [editable, getSvgPoint, isInsidePlot, fromSvgCoords]
  )

  const handleSvgContextMenu = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!editable || !isDrawing) return
      e.preventDefault()
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

      if (!editable && isInsidePlot(coords.svgX, coords.svgY)) {
        const { azDeg, altDeg } = fromSvgCoords(coords.svgX, coords.svgY)
        setHoveredPoint({ x: coords.svgX, y: coords.svgY, az: azDeg, alt: altDeg })
      }
    },
    [dragging, editable, obstructions, updateObstructions, getSvgPoint, fromSvgCoords, isInsidePlot]
  )

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
        onMouseUp={() => setDragging(null)}
      >
        <WaldramGrid
          margin={margin}
          plotW={plotW}
          plotH={plotH}
          svgWidth={svgWidth}
          svgHeight={svgHeight}
          toSvgX={toSvgX}
          toSvgY={toSvgY}
        />

        <WaldramSunPaths projectedSunPaths={projectedSunPaths} />

        <WaldramObstructions
          projectedObstructions={projectedObstructions}
          editable={editable}
          selectedIdx={selectedIdx}
          onSelect={setSelectedIdx}
          onVertexMouseDown={handleVertexMouseDown}
          fromSvgCoords={fromSvgCoords}
          onHover={setHoveredPoint}
        />

        {/* Current polygon being drawn (editable mode) */}
        {editable && isDrawing && currentPoints.length > 0 && (
          <g>
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

        <WaldramTooltip hoveredPoint={hoveredPoint} editable={editable} />
      </svg>

      <WaldramLegend
        obstructions={projectedObstructions}
        sunPaths={projectedSunPaths}
        editable={editable}
        selectedIdx={selectedIdx}
        onSelect={setSelectedIdx}
      />

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
