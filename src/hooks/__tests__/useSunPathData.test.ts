import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'

// Mock useApi before importing the hook
vi.mock('@/contexts/ApiContext', () => ({
  useApi: () => ({
    apiUrl: 'http://localhost:8000',
    backendStatus: 'healthy' as const,
    backendInfo: null,
  }),
}))

import { useSunPathData } from '../useSunPathData'

describe('useSunPathData', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts with loading=false, data=null, error=null', () => {
    // enabled=false so no fetch occurs
    const { result } = renderHook(() =>
      useSunPathData({ latitude: 37.5, longitude: 127, enabled: false })
    )

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('does not fetch when enabled is false', () => {
    const mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)

    renderHook(() =>
      useSunPathData({ latitude: 37.5, longitude: 127, enabled: false })
    )

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('fetches data when enabled', async () => {
    const mockPaths = [
      { label: 'Jun 21', date: '2024-06-21', data: [{ hour: 12, altitude: 75, azimuth: 180 }] },
    ]

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ paths: mockPaths }),
      })
    )

    const { result } = renderHook(() =>
      useSunPathData({ latitude: 37.5, longitude: 127, enabled: true })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(mockPaths)
    expect(result.current.error).toBeNull()
  })

  it('sets error on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    )

    const { result } = renderHook(() =>
      useSunPathData({ latitude: 37.5, longitude: 127, enabled: true })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toContain('500')
    expect(result.current.data).toBeNull()
  })

  it('sets error on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error'))
    )

    const { result } = renderHook(() =>
      useSunPathData({ latitude: 37.5, longitude: 127, enabled: true })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })

  it('uses apiBaseUrl when provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ paths: [] }),
    })
    vi.stubGlobal('fetch', mockFetch)

    renderHook(() =>
      useSunPathData({
        latitude: 37.5,
        longitude: 127,
        apiBaseUrl: 'http://custom:9000',
        enabled: true,
      })
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('http://custom:9000')
  })

  it('constructs URL with lat, lng, and year params', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ paths: [] }),
    })
    vi.stubGlobal('fetch', mockFetch)

    renderHook(() =>
      useSunPathData({
        latitude: 37.5665,
        longitude: 126.978,
        year: 2024,
        enabled: true,
      })
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('lat=37.5665')
    expect(calledUrl).toContain('lng=126.978')
    expect(calledUrl).toContain('year=2024')
  })
})
