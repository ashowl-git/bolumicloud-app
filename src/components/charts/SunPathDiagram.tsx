'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { Info } from 'lucide-react'
import { useSunPathData } from '@/hooks/useSunPathData'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import { DEG, stereoR, sunPosition } from './sunpath/solar-position'
import { defaultDates, DATE_COLORS, dateLabel } from './sunpath/defaults'
import SunPathGrid from './sunpath/SunPathGrid'
import SunPathCurves from './sunpath/SunPathCurves'
import SunPathTooltip from './sunpath/SunPathTooltip'
import SunPathLegend from './sunpath/SunPathLegend'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SunPathDiagramProps {
  latitude: number
  longitude: number
  dates?: Date[]
  timeZoneOffset?: number // hours from UTC, default 9 (KST)
  obstructions?: Array<{
    points: Array<{ azimuth: number; altitude: number }>
  }>
  width?: number
  height?: number
  dataSource?: 'local' | 'backend' // default 'local'
  apiBaseUrl?: string // default: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SunPathDiagram({
  latitude,
  longitude,
  dates,
  timeZoneOffset = 9,
  obstructions,
  width: propWidth,
  height: propHeight,
  dataSource = 'local',
  apiBaseUrl,
}: SunPathDiagramProps) {
  // ---- responsive sizing ------------------------------------------------
  const containerRef = useRef<HTMLDivElement>(null)
  const { width: containerWidth } = useResizeObserver(containerRef)

  const size = propWidth ?? propHeight ?? (containerWidth > 0 ? Math.min(containerWidth, 600) : 500)
  const svgSize = size
  const cx = svgSize / 2
  const cy = svgSize / 2
  const radius = (svgSize - 80) / 2

  // ---- coordinate transforms --------------------------------------------
  const toSvg = useCallback(
    (azDeg: number, altDeg: number) => {
      const r = stereoR(altDeg) * radius
      const theta = (azDeg - 90) * DEG
      const x = cx + r * Math.cos(theta)
      const y = cy + r * Math.sin(theta)
      return { x, y }
    },
    [cx, cy, radius]
  )

  // ---- backend data hook ------------------------------------------------
  const { data: backendPaths, loading: backendLoading, error: backendError } = useSunPathData({
    latitude,
    longitude,
    year: new Date().getFullYear(),
    apiBaseUrl,
    enabled: dataSource === 'backend',
  })

  // ---- sun paths --------------------------------------------------------
  const usedDates = dates ?? defaultDates()

  const localSunPaths = useMemo(() => {
    if (dataSource === 'backend') return []
    return usedDates.map((date, di) => {
      const positions: Array<{
        hour: number; alt: number; az: number; x: number; y: number
      }> = []

      for (let h = 4; h <= 20; h += 10 / 60) {
        const pos = sunPosition(latitude, longitude, date, h, timeZoneOffset)
        if (pos.altitude > 0) {
          const { x, y } = toSvg(pos.azimuth, pos.altitude)
          positions.push({ hour: h, alt: pos.altitude, az: pos.azimuth, x, y })
        }
      }

      const hourlyMarkers = positions.filter(
        (p) => Math.abs(p.hour - Math.round(p.hour)) < 0.01
      )

      return {
        date,
        color: DATE_COLORS[di % DATE_COLORS.length],
        label: dateLabel(date),
        positions,
        hourlyMarkers,
      }
    })
  }, [usedDates, latitude, longitude, timeZoneOffset, toSvg, dataSource])

  const backendSunPaths = useMemo(() => {
    if (dataSource !== 'backend' || !backendPaths) return []
    return backendPaths.map((entry, di) => {
      const positions = entry.data
        .filter((p) => p.altitude > 0)
        .map((p) => {
          const { x, y } = toSvg(p.azimuth, p.altitude)
          return { hour: p.hour, alt: p.altitude, az: p.azimuth, x, y }
        })

      const hourlyMarkers = positions.filter(
        (p) => Math.abs(p.hour - Math.round(p.hour)) < 0.01
      )

      return {
        date: new Date(entry.date),
        color: DATE_COLORS[di % DATE_COLORS.length],
        label: entry.label,
        positions,
        hourlyMarkers,
      }
    })
  }, [backendPaths, toSvg, dataSource])

  const sunPaths = dataSource === 'backend' ? backendSunPaths : localSunPaths

  // ---- obstruction overlay -----------------------------------------------
  const obstructionPaths = useMemo(() => {
    if (!obstructions) return []
    return obstructions.map((obs) =>
      obs.points.map((p) => toSvg(p.azimuth, p.altitude))
    )
  }, [obstructions, toSvg])

  // ---- hover state -------------------------------------------------------
  const [hovered, setHovered] = useState<{
    x: number; y: number; hour: number; alt: number; az: number; dateLabel: string
  } | null>(null)

  return (
    <div ref={containerRef} className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Sun Path Diagram</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            ({latitude.toFixed(4)}, {longitude.toFixed(4)}) | UTC+{timeZoneOffset}
            {dataSource === 'backend' && (
              <span className="ml-2 text-blue-500">[Backend]</span>
            )}
          </p>
        </div>
      </div>

      {/* Backend loading / error state */}
      {dataSource === 'backend' && backendLoading && (
        <div className="mb-3 text-xs text-gray-400">Loading sun path data from server...</div>
      )}
      {dataSource === 'backend' && backendError && (
        <div className="mb-3 text-xs text-red-500">
          Failed to load data: {backendError}
        </div>
      )}

      {/* SVG Diagram */}
      <svg
        width={svgSize}
        height={svgSize}
        className="border border-gray-200 bg-white select-none"
        onMouseLeave={() => setHovered(null)}
      >
        <SunPathGrid cx={cx} cy={cy} radius={radius} />

        {/* Obstruction overlays */}
        {obstructionPaths.map((pts, idx) => {
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z'
          return (
            <path
              key={`obs-${idx}`}
              d={d}
              fill="#64748b"
              fillOpacity={0.2}
              stroke="#64748b"
              strokeWidth={1}
              strokeLinejoin="round"
            />
          )
        })}

        <SunPathCurves
          sunPaths={sunPaths}
          obstructions={obstructions}
          onHover={setHovered}
        />

        <SunPathTooltip hovered={hovered} svgSize={svgSize} />
      </svg>

      <SunPathLegend
        sunPaths={sunPaths}
        hasObstructions={!!(obstructions && obstructions.length > 0)}
      />

      {/* Info note */}
      <div className="mt-2 flex items-start gap-1.5 text-[10px] text-gray-400">
        <Info size={12} className="mt-0.5 shrink-0" />
        <span>
          Stereographic polar projection. Outer circle = horizon (0 deg altitude),
          centre = zenith (90 deg). Dots mark hourly sun positions.
        </span>
      </div>
    </div>
  )
}
