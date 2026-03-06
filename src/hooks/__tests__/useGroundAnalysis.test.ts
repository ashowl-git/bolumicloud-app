import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockPost = vi.fn()
const mockGet = vi.fn()

vi.mock('@/lib/api', () => ({
  useApiClient: () => ({
    get: mockGet,
    post: mockPost,
    postFormData: vi.fn(),
    del: vi.fn(),
    downloadBlob: vi.fn(),
    getBlob: vi.fn(),
    postBlob: vi.fn(),
  }),
}))

vi.mock('@/contexts/ApiContext', () => ({
  useApi: () => ({
    apiUrl: 'http://localhost:8000',
    backendStatus: 'healthy' as const,
    backendInfo: null,
  }),
}))

import { useGroundAnalysis } from '../useGroundAnalysis'

const baseConfig = {
  latitude: 37.5665,
  longitude: 126.978,
  timezone: 135,
  date: { month: 12, day: 21 },
}

describe('useGroundAnalysis', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockPost.mockReset()
    mockGet.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ── Initial state ──

  it('starts with null result and not analyzing', () => {
    const { result } = renderHook(() =>
      useGroundAnalysis({ sessionId: 's1', config: baseConfig, gridInterval: 2.0 })
    )

    expect(result.current.groundResult).toBeNull()
    expect(result.current.groundIsochrones).toEqual([])
    expect(result.current.showGroundHeatmap).toBe(false)
    expect(result.current.isGroundAnalyzing).toBe(false)
  })

  // ── Does nothing without sessionId ──

  it('does nothing when sessionId is null', async () => {
    const { result } = renderHook(() =>
      useGroundAnalysis({ sessionId: null, config: baseConfig, gridInterval: 2.0 })
    )

    await act(async () => {
      await result.current.runGroundAnalysis()
    })

    expect(mockPost).not.toHaveBeenCalled()
    expect(result.current.isGroundAnalyzing).toBe(false)
  })

  // ── Starts analysis ──

  it('posts to ground-analysis and starts polling', async () => {
    mockPost.mockResolvedValueOnce({ ground_id: 'g1' })

    const { result } = renderHook(() =>
      useGroundAnalysis({ sessionId: 's1', config: baseConfig, gridInterval: 2.0 })
    )

    await act(async () => {
      await result.current.runGroundAnalysis()
    })

    expect(result.current.isGroundAnalyzing).toBe(true)
    expect(result.current.showGroundHeatmap).toBe(true)
    expect(mockPost).toHaveBeenCalledWith('/sunlight/ground-analysis', expect.objectContaining({
      session_id: 's1',
      latitude: 37.5665,
      longitude: 126.978,
    }))
  })

  // ── Full completion flow ──

  it('completes analysis after polling returns completed', async () => {
    mockPost.mockResolvedValueOnce({ ground_id: 'g1' })

    const { result } = renderHook(() =>
      useGroundAnalysis({ sessionId: 's1', config: baseConfig, gridInterval: 2.0 })
    )

    await act(async () => {
      await result.current.runGroundAnalysis()
    })

    // Poll status: completed
    mockGet
      .mockResolvedValueOnce({ status: 'completed' })
      .mockResolvedValueOnce({ points: [{ x: 0, y: 0, hours: 4 }] })
      .mockResolvedValueOnce({ isochrones: [{ hours: 2, points: [] }] })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(result.current.isGroundAnalyzing).toBe(false)
    expect(result.current.groundResult).toEqual({ points: [{ x: 0, y: 0, hours: 4 }] })
    expect(result.current.groundIsochrones).toEqual([{ hours: 2, points: [] }])
  })

  // ── Error status ──

  it('stops analyzing on error status', async () => {
    mockPost.mockResolvedValueOnce({ ground_id: 'g1' })

    const { result } = renderHook(() =>
      useGroundAnalysis({ sessionId: 's1', config: baseConfig, gridInterval: 2.0 })
    )

    await act(async () => {
      await result.current.runGroundAnalysis()
    })

    mockGet.mockResolvedValueOnce({ status: 'error' })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(result.current.isGroundAnalyzing).toBe(false)
  })

  // ── Post failure ──

  it('stops analyzing on post failure', async () => {
    mockPost.mockRejectedValueOnce(new Error('server down'))

    const { result } = renderHook(() =>
      useGroundAnalysis({ sessionId: 's1', config: baseConfig, gridInterval: 2.0 })
    )

    await act(async () => {
      await result.current.runGroundAnalysis()
    })

    expect(result.current.isGroundAnalyzing).toBe(false)
  })

  // ── setShowGroundHeatmap ──

  it('setShowGroundHeatmap toggles heatmap visibility', () => {
    const { result } = renderHook(() =>
      useGroundAnalysis({ sessionId: 's1', config: baseConfig, gridInterval: 2.0 })
    )

    act(() => result.current.setShowGroundHeatmap(true))
    expect(result.current.showGroundHeatmap).toBe(true)

    act(() => result.current.setShowGroundHeatmap(false))
    expect(result.current.showGroundHeatmap).toBe(false)
  })
})
