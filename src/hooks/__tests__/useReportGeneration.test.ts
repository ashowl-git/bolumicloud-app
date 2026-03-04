import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock dependencies before importing the hook
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

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { useReportGeneration } from '../useReportGeneration'

describe('useReportGeneration', () => {
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

  it('starts with no report, not loading, no error', () => {
    const { result } = renderHook(() =>
      useReportGeneration({ sessionId: 's1', results: { some: 'data' } })
    )

    expect(result.current.reportDownloadUrl).toBeNull()
    expect(result.current.isGeneratingReport).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.causeResult).toBeNull()
  })

  // ── Does nothing without sessionId ──

  it('does nothing when sessionId is null', async () => {
    const { result } = renderHook(() =>
      useReportGeneration({ sessionId: null, results: { some: 'data' } })
    )

    await act(async () => {
      await result.current.generateReport()
    })

    expect(mockPost).not.toHaveBeenCalled()
    expect(result.current.isGeneratingReport).toBe(false)
  })

  // ── Does nothing without results ──

  it('does nothing when results is null', async () => {
    const { result } = renderHook(() =>
      useReportGeneration({ sessionId: 's1', results: null })
    )

    await act(async () => {
      await result.current.generateReport()
    })

    expect(mockPost).not.toHaveBeenCalled()
  })

  // ── Full generation -> polling -> completed flow ──

  it('generates report, polls, and completes with download URL', async () => {
    mockPost.mockResolvedValueOnce({ report_id: 'r1' })

    const { result } = renderHook(() =>
      useReportGeneration({ sessionId: 's1', results: { some: 'data' } })
    )

    await act(async () => {
      await result.current.generateReport()
    })

    expect(result.current.isGeneratingReport).toBe(true)
    expect(mockPost).toHaveBeenCalledWith('/reports/generate', {
      session_id: 's1',
      analysis_result: { some: 'data' },
    })

    // Poll returns completed
    mockGet.mockResolvedValueOnce({
      status: 'completed',
      download_url: '/reports/r1/download',
      cause_analysis: { buildings: [], point_causes: [], total_non_compliant: 0 },
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(result.current.isGeneratingReport).toBe(false)
    expect(result.current.reportDownloadUrl).toBe('http://localhost:8000/reports/r1/download')
    expect(result.current.causeResult).toEqual({
      buildings: [],
      point_causes: [],
      total_non_compliant: 0,
    })
  })

  // ── analysisType parameter is passed correctly ──

  it('passes analysisType to API when not sunlight', async () => {
    mockPost.mockResolvedValueOnce({ report_id: 'r1' })

    const { result } = renderHook(() =>
      useReportGeneration({
        sessionId: 's1',
        analysisType: 'view',
        results: { some: 'data' },
      })
    )

    await act(async () => {
      await result.current.generateReport()
    })

    expect(mockPost).toHaveBeenCalledWith('/reports/generate', {
      session_id: 's1',
      analysis_result: { some: 'data' },
      analysis_type: 'view',
    })
  })

  // ── Sunlight-specific config fields ──

  it('includes sunlight config fields when analysisType is sunlight', async () => {
    mockPost.mockResolvedValueOnce({ report_id: 'r1' })

    const { result } = renderHook(() =>
      useReportGeneration({
        sessionId: 's1',
        analysisType: 'sunlight',
        config: {
          latitude: 37.5,
          longitude: 127.0,
          timezone: 135,
          date: { month: 12, day: 21 },
          buildingType: 'apartment',
        },
        results: { some: 'data' },
      })
    )

    await act(async () => {
      await result.current.generateReport()
    })

    expect(mockPost).toHaveBeenCalledWith('/reports/generate', {
      session_id: 's1',
      analysis_result: { some: 'data' },
      latitude: 37.5,
      longitude: 127.0,
      timezone_offset: 9,
      month: 12,
      day: 21,
      building_type: 'apartment',
    })
  })

  // ── Error during generation ──

  it('sets error when generate call throws', async () => {
    mockPost.mockRejectedValueOnce(new Error('server down'))

    const { result } = renderHook(() =>
      useReportGeneration({ sessionId: 's1', results: { some: 'data' } })
    )

    await act(async () => {
      await result.current.generateReport()
    })

    expect(result.current.isGeneratingReport).toBe(false)
    expect(result.current.error).toBe('보고서 생성 오류')
  })

  // ── Error during status polling ──

  it('sets error when polling returns error status', async () => {
    mockPost.mockResolvedValueOnce({ report_id: 'r1' })

    const { result } = renderHook(() =>
      useReportGeneration({ sessionId: 's1', results: { some: 'data' } })
    )

    await act(async () => {
      await result.current.generateReport()
    })

    mockGet.mockResolvedValueOnce({
      status: 'error',
      error: 'generation failed',
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(result.current.isGeneratingReport).toBe(false)
    expect(result.current.error).toBe('generation failed')
  })

  // ── Error when status polling throws ──

  it('sets error when polling fetch throws', async () => {
    mockPost.mockResolvedValueOnce({ report_id: 'r1' })

    const { result } = renderHook(() =>
      useReportGeneration({ sessionId: 's1', results: { some: 'data' } })
    )

    await act(async () => {
      await result.current.generateReport()
    })

    mockGet.mockRejectedValueOnce(new Error('network'))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(result.current.isGeneratingReport).toBe(false)
    expect(result.current.error).toBe('보고서 상태 조회 실패')
  })

  // ── Cleanup on unmount ──

  it('clears polling interval on unmount', async () => {
    mockPost.mockResolvedValueOnce({ report_id: 'r1' })

    const { result, unmount } = renderHook(() =>
      useReportGeneration({ sessionId: 's1', results: { some: 'data' } })
    )

    await act(async () => {
      await result.current.generateReport()
    })

    unmount()

    const callCount = mockGet.mock.calls.length

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000)
    })

    expect(mockGet.mock.calls.length).toBe(callCount)
  })
})
