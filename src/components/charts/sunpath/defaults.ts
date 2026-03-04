// ---------------------------------------------------------------------------
// Default dates: solstices + equinoxes
// ---------------------------------------------------------------------------

export function defaultDates(): Date[] {
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

export const DATE_COLORS = [
  '#22c55e', // spring equinox - green
  '#ef4444', // summer solstice - red
  '#f59e0b', // autumn equinox - amber
  '#3b82f6', // winter solstice - blue
]

export function dateLabel(d: Date): string {
  const m = d.getMonth()
  if (m === 2) return 'Equinox (Mar)'
  if (m === 5) return 'Solstice (Jun)'
  if (m === 8) return 'Equinox (Sep)'
  if (m === 11) return 'Solstice (Dec)'
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// ---------------------------------------------------------------------------
// Grid definitions
// ---------------------------------------------------------------------------

export const ALTITUDE_CIRCLES = [10, 20, 30, 40, 50, 60, 70, 80]

export const AZIMUTH_DIRECTIONS = [
  { deg: 0, label: 'N' },
  { deg: 45, label: 'NE' },
  { deg: 90, label: 'E' },
  { deg: 135, label: 'SE' },
  { deg: 180, label: 'S' },
  { deg: 225, label: 'SW' },
  { deg: 270, label: 'W' },
  { deg: 315, label: 'NW' },
] as const
