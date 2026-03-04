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

export const DEG = Math.PI / 180

/** Convert altitude (degrees) to Waldram y coordinate (0..0.5). */
export function waldramY(altDeg: number): number {
  const alt = altDeg * DEG
  return 0.5 * Math.sin(2 * alt)
}

/** Default palette for obstructions */
export const PALETTE = [
  '#64748b', // slate-500
  '#6366f1', // indigo-500
  '#0ea5e9', // sky-500
  '#14b8a6', // teal-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
]

/** Default sun path colors for up to 4 dates */
export const SUN_PATH_PALETTE = [
  '#22c55e', // green
  '#ef4444', // red
  '#f59e0b', // amber
  '#3b82f6', // blue
]
