import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWaldramData, type BuildingSilhouette } from '../useWaldramData'

describe('useWaldramData', () => {
  it('returns empty obstructions for empty input', () => {
    const { result } = renderHook(() => useWaldramData([]))
    expect(result.current.obstructions).toEqual([])
  })

  it('returns empty points for a silhouette with empty profile', () => {
    const silhouettes: BuildingSilhouette[] = [
      { name: 'Building A', profile: [] },
    ]
    const { result } = renderHook(() => useWaldramData(silhouettes))
    expect(result.current.obstructions).toHaveLength(1)
    expect(result.current.obstructions[0].name).toBe('Building A')
    expect(result.current.obstructions[0].points).toEqual([])
  })

  it('closes polygon along horizon for a single-point profile', () => {
    const silhouettes: BuildingSilhouette[] = [
      { name: 'Tower', profile: [{ azimuth: 10, altitude: 30 }] },
    ]
    const { result } = renderHook(() => useWaldramData(silhouettes))
    const obs = result.current.obstructions[0]

    // Expected: top point, bottom-right (same azimuth, alt=0), bottom-left (same azimuth, alt=0)
    expect(obs.points).toHaveLength(3)
    expect(obs.points[0]).toEqual({ azimuth: 10, altitude: 30 })
    expect(obs.points[1]).toEqual({ azimuth: 10, altitude: 0 })
    expect(obs.points[2]).toEqual({ azimuth: 10, altitude: 0 })
  })

  it('sorts profile by azimuth and closes polygon', () => {
    const silhouettes: BuildingSilhouette[] = [
      {
        name: 'Building B',
        profile: [
          { azimuth: 30, altitude: 20 },
          { azimuth: 10, altitude: 25 },
          { azimuth: 20, altitude: 15 },
        ],
      },
    ]
    const { result } = renderHook(() => useWaldramData(silhouettes))
    const obs = result.current.obstructions[0]

    // Sorted top edge: az 10, 20, 30
    expect(obs.points[0].azimuth).toBe(10)
    expect(obs.points[1].azimuth).toBe(20)
    expect(obs.points[2].azimuth).toBe(30)

    // Bottom-right corner
    expect(obs.points[3]).toEqual({ azimuth: 30, altitude: 0 })
    // Bottom-left corner
    expect(obs.points[4]).toEqual({ azimuth: 10, altitude: 0 })

    expect(obs.points).toHaveLength(5)
  })

  it('handles multiple silhouettes', () => {
    const silhouettes: BuildingSilhouette[] = [
      { name: 'A', profile: [{ azimuth: 0, altitude: 10 }] },
      { name: 'B', profile: [{ azimuth: 20, altitude: 30 }] },
    ]
    const { result } = renderHook(() => useWaldramData(silhouettes))
    expect(result.current.obstructions).toHaveLength(2)
    expect(result.current.obstructions[0].name).toBe('A')
    expect(result.current.obstructions[1].name).toBe('B')
  })

  it('preserves original profile altitudes in top edge', () => {
    const profile = [
      { azimuth: -10, altitude: 15 },
      { azimuth: 5, altitude: 40 },
      { azimuth: 20, altitude: 25 },
    ]
    const { result } = renderHook(() =>
      useWaldramData([{ name: 'test', profile }])
    )
    const obs = result.current.obstructions[0]
    // Top edge altitudes should be preserved (sorted by azimuth)
    expect(obs.points[0].altitude).toBe(15)
    expect(obs.points[1].altitude).toBe(40)
    expect(obs.points[2].altitude).toBe(25)
  })
})
