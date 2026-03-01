'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'

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
}

// ---------------------------------------------------------------------------
// Solar position algorithm
//
// Based on NOAA solar equations (Jean Meeus, Astronomical Algorithms).
// Accuracy: ~1 arcmin for dates within a few decades of 2000.
// ---------------------------------------------------------------------------

const DEG = Math.PI / 180
const RAD = 180 / Math.PI

/** Day of year (1-366). */
function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / 86400000)
}

/** Fractional year (radians). */
function fractionalYear(d: Date): number {
  const doy = dayOfYear(d)
  const hour = d.getUTCHours()
  const isLeap =
    d.getFullYear() % 4 === 0 &&
    (d.getFullYear() % 100 !== 0 || d.getFullYear() % 400 === 0)
  const daysInYear = isLeap ? 366 : 365
  return (2 * Math.PI * (doy - 1 + (hour - 12) / 24)) / daysInYear
}

/** Equation of time (minutes). */
function equationOfTime(gamma: number): number {
  return (
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.04089 * Math.sin(2 * gamma))
  )
}

/** Solar declination (radians). */
function solarDeclination(gamma: number): number {
  return (
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma)
  )
}

interface SunPosition {
  altitude: number // degrees above horizon
  azimuth: number // degrees clockwise from north
}

/**
 * Compute sun altitude and azimuth for given location, date and hour.
 * @param lat  latitude in degrees (north positive)
 * @param lng  longitude in degrees (east positive)
 * @param date  the date
 * @param hour  local solar hour (0-24)
 * @param tzOffset  timezone offset from UTC in hours
 */
function sunPosition(
  lat: number,
  lng: number,
  date: Date,
  hour: number,
  tzOffset: number
): SunPosition {
  const d = new Date(date)
  d.setUTCHours(Math.floor(hour) - tzOffset, (hour % 1) * 60, 0, 0)

  const gamma = fractionalYear(d)
  const eqTime = equationOfTime(gamma)
  const decl = solarDeclination(gamma)

  // True solar time (minutes)
  const trueSolarTime = hour * 60 + eqTime + 4 * (lng - tzOffset * 15)

  // Hour angle (degrees)
  const ha = trueSolarTime / 4 - 180

  const latRad = lat * DEG
  const sinAlt =
    Math.sin(latRad) * Math.sin(decl) +
    Math.cos(latRad) * Math.cos(decl) * Math.cos(ha * DEG)
  const altitude = Math.asin(sinAlt) * RAD

  // Azimuth (from north, clockwise)
  const cosAz =
    (Math.sin(decl) - Math.sin(latRad) * sinAlt) /
    (Math.cos(latRad) * Math.cos(Math.asin(sinAlt)))
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * RAD

  if (ha > 0) {
    azimuth = 360 - azimuth
  }

  return { altitude, azimuth }
}

// ---------------------------------------------------------------------------
// Stereographic projection for sun path diagram
//
// Standard polar stereographic projection from the zenith:
//   r = cos(altitude) / (1 + sin(altitude))   [normalised 0..1]
//   theta = azimuth (clockwise from North)
//
// This maps the horizon (alt=0) to r=1 and the zenith (alt=90) to r=0.
// ---------------------------------------------------------------------------

function stereoR(altDeg: number): number {
  const alt = Math.max(0, altDeg) * DEG
  return Math.cos(alt) / (1 + Math.sin(alt))
}

// ---------------------------------------------------------------------------
// Default dates: solstices + equinoxes
// ---------------------------------------------------------------------------

function defaultDates(): Date[] {
  const y = new Date().getFullYear()
  return [
    new Date(y, 2, 20), // Vernal equinox (Mar 20)
    new Date(y, 5, 21), // Summer solstice (Jun 21)
    new Date(y, 8, 23), // Autumnal equinox (Sep 23)
    new Date(y, 11, 21), // Winter solstice (Dec 21)
  ]
}

// ---------------------------------------------------------------------------
// Date colours & labels
// ---------------------------------------------------------------------------

const DATE_COLORS = [
  '#22c55e', // spring equinox - green
  '#ef4444', // summer solstice - red
  '#f59e0b', // autumn equinox - amber
  '#3b82f6', // winter solstice - blue
]

function dateLabel(d: Date): string {
  const m = d.getMonth()
  if (m === 2) return 'Equinox (Mar)'
  if (m === 5) return 'Solstice (Jun)'
  if (m === 8) return 'Equinox (Sep)'
  if (m === 11) return 'Solstice (Dec)'
  return `${d.getMonth() + 1}/${d.getDate()}`
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
}: SunPathDiagramProps) {
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

  const size = propWidth ?? propHeight ?? (containerWidth > 0 ? Math.min(containerWidth, 600) : 500)
  const svgSize = size
  const cx = svgSize / 2
  const cy = svgSize / 2
  const radius = (svgSize - 80) / 2 // leave margin for labels

  // ---- coordinate transforms --------------------------------------------
  // azimuth: degrees clockwise from north
  // r: stereographic radius [0..1] mapped to [0..radius]
  const toSvg = useCallback(
    (azDeg: number, altDeg: number) => {
      const r = stereoR(altDeg) * radius
      // In SVG: angle measured from top (north), clockwise
      const theta = (azDeg - 90) * DEG // shift so 0deg(N) points up
      const x = cx + r * Math.cos(theta)
      const y = cy + r * Math.sin(theta)
      return { x, y }
    },
    [cx, cy, radius]
  )

  // ---- sun paths --------------------------------------------------------
  const usedDates = dates ?? defaultDates()

  const sunPaths = useMemo(() => {
    return usedDates.map((date, di) => {
      const positions: Array<{
        hour: number
        alt: number
        az: number
        x: number
        y: number
      }> = []

      // Compute positions from 4:00 to 20:00 in 10-minute steps
      for (let h = 4; h <= 20; h += 10 / 60) {
        const pos = sunPosition(latitude, longitude, date, h, timeZoneOffset)
        if (pos.altitude > 0) {
          const { x, y } = toSvg(pos.azimuth, pos.altitude)
          positions.push({
            hour: h,
            alt: pos.altitude,
            az: pos.azimuth,
            x,
            y,
          })
        }
      }

      // Hourly markers (whole hours only)
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
  }, [usedDates, latitude, longitude, timeZoneOffset, toSvg])

  // ---- obstruction overlay -----------------------------------------------
  const obstructionPaths = useMemo(() => {
    if (!obstructions) return []
    return obstructions.map((obs) =>
      obs.points.map((p) => toSvg(p.azimuth, p.altitude))
    )
  }, [obstructions, toSvg])

  // ---- hover state -------------------------------------------------------
  const [hovered, setHovered] = useState<{
    x: number
    y: number
    hour: number
    alt: number
    az: number
    dateLabel: string
  } | null>(null)

  // ---- grid definitions --------------------------------------------------
  const altitudeCircles = [10, 20, 30, 40, 50, 60, 70, 80]
  const azimuthDirections = [
    { deg: 0, label: 'N' },
    { deg: 45, label: 'NE' },
    { deg: 90, label: 'E' },
    { deg: 135, label: 'SE' },
    { deg: 180, label: 'S' },
    { deg: 225, label: 'SW' },
    { deg: 270, label: 'W' },
    { deg: 315, label: 'NW' },
  ]

  return (
    <div ref={containerRef} className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Sun Path Diagram</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            ({latitude.toFixed(4)}, {longitude.toFixed(4)}) | UTC+{timeZoneOffset}
          </p>
        </div>
      </div>

      {/* SVG Diagram */}
      <svg
        width={svgSize}
        height={svgSize}
        className="border border-gray-200 bg-white select-none"
        onMouseLeave={() => setHovered(null)}
      >
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
        {altitudeCircles.map((alt) => {
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
        {azimuthDirections.map(({ deg, label }) => {
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

        {/* Sun paths */}
        {sunPaths.map((sp, si) => {
          if (sp.positions.length < 2) return null
          const pathD = sp.positions
            .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(' ')

          return (
            <g key={`path-${si}`}>
              {/* Path line */}
              <path
                d={pathD}
                fill="none"
                stroke={sp.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
              />

              {/* Hourly markers */}
              {sp.hourlyMarkers.map((m) => (
                <g key={`marker-${si}-${m.hour}`}>
                  <circle
                    cx={m.x}
                    cy={m.y}
                    r={4}
                    fill={sp.color}
                    stroke="white"
                    strokeWidth={1.5}
                    className="cursor-pointer"
                    onMouseEnter={() =>
                      setHovered({
                        x: m.x,
                        y: m.y,
                        hour: m.hour,
                        alt: m.alt,
                        az: m.az,
                        dateLabel: sp.label,
                      })
                    }
                  />
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
              ))}
            </g>
          )
        })}

        {/* Zenith marker */}
        <circle cx={cx} cy={cy} r={2} fill="#94a3b8" />

        {/* Hover tooltip */}
        {hovered && (
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
        )}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {sunPaths.map((sp, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span
              className="w-3 h-0.5 inline-block"
              style={{ backgroundColor: sp.color }}
            />
            <span>{sp.label}</span>
          </div>
        ))}
        {obstructions && obstructions.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-3 h-3 inline-block bg-slate-500 opacity-30" />
            <span>Obstructions</span>
          </div>
        )}
      </div>

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
