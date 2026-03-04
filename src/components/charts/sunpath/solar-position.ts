// ---------------------------------------------------------------------------
// Solar position algorithm
//
// Based on NOAA solar equations (Jean Meeus, Astronomical Algorithms).
// Accuracy: ~1 arcmin for dates within a few decades of 2000.
// ---------------------------------------------------------------------------

export const DEG = Math.PI / 180
export const RAD = 180 / Math.PI

/** Day of year (1-366). */
export function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / 86400000)
}

/** Fractional year (radians). */
export function fractionalYear(d: Date): number {
  const doy = dayOfYear(d)
  const hour = d.getUTCHours()
  const isLeap =
    d.getFullYear() % 4 === 0 &&
    (d.getFullYear() % 100 !== 0 || d.getFullYear() % 400 === 0)
  const daysInYear = isLeap ? 366 : 365
  return (2 * Math.PI * (doy - 1 + (hour - 12) / 24)) / daysInYear
}

/** Equation of time (minutes). */
export function equationOfTime(gamma: number): number {
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
export function solarDeclination(gamma: number): number {
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

export interface SunPosition {
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
export function sunPosition(
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

export function stereoR(altDeg: number): number {
  const alt = Math.max(0, altDeg) * DEG
  return Math.cos(alt) / (1 + Math.sin(alt))
}

// ---------------------------------------------------------------------------
// Point-in-polygon test (ray casting algorithm)
//
// Tests whether a point (azimuth, altitude) lies inside an obstruction
// polygon defined in the same coordinate space.
// ---------------------------------------------------------------------------

export function isPointInPolygon(
  point: { azimuth: number; altitude: number },
  polygon: Array<{ azimuth: number; altitude: number }>
): boolean {
  if (polygon.length < 3) return false
  let inside = false
  const { azimuth: px, altitude: py } = point

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].azimuth
    const yi = polygon[i].altitude
    const xj = polygon[j].azimuth
    const yj = polygon[j].altitude

    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }

  return inside
}
