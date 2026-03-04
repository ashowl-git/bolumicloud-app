'use client'

import { useMemo } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BuildingSilhouette {
  name: string
  /**
   * Array of (azimuth, altitude) pairs defining the building profile
   * as seen from the viewpoint. Defines the visible skyline edge of the
   * building against the sky hemisphere.
   */
  profile: Array<{ azimuth: number; altitude: number }>
}

export interface WaldramObstruction {
  name: string
  /** Closed polygon points in (azimuth, altitude) space. */
  points: Array<{ azimuth: number; altitude: number }>
  color?: string
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useWaldramData
 *
 * Converts an array of building silhouettes (horizon profiles) into
 * Waldram obstruction polygons suitable for use with WaldramChart.
 *
 * Each silhouette profile defines the upper (skyline) edge of a building.
 * This hook closes the polygon by appending a bottom edge at altitude = 0
 * (the horizon), forming a closed region that can be rendered as a filled
 * obstruction on the Waldram diagram.
 *
 * Polygon winding:
 *   Top edge: left-to-right (sorted by ascending azimuth)
 *   Bottom-right corner: (lastAzimuth, 0)
 *   Bottom-left corner:  (firstAzimuth, 0)
 *   -> polygon is implicitly closed back to the first top-edge point
 */
export function useWaldramData(silhouettes: BuildingSilhouette[]) {
  const obstructions = useMemo((): WaldramObstruction[] => {
    return silhouettes.map((sil) => {
      if (sil.profile.length === 0) {
        return { name: sil.name, points: [] }
      }

      // Sort profile points by azimuth (left to right on the chart)
      const sorted = [...sil.profile].sort((a, b) => a.azimuth - b.azimuth)

      const points: Array<{ azimuth: number; altitude: number }> = []

      // Top edge: the actual building skyline (left to right)
      for (const p of sorted) {
        points.push({ azimuth: p.azimuth, altitude: p.altitude })
      }

      // Close polygon along the horizon (altitude = 0):
      // bottom-right corner, then bottom-left corner.
      // The SVG polygon element will auto-close back to the first top-edge point.
      points.push({ azimuth: sorted[sorted.length - 1].azimuth, altitude: 0 })
      points.push({ azimuth: sorted[0].azimuth, altitude: 0 })

      return {
        name: sil.name,
        points,
      }
    })
  }, [silhouettes])

  return { obstructions }
}
