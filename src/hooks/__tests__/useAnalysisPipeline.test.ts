import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockGet = vi.fn()
const mockDel = vi.fn()

vi.mock('@/lib/api', () => ({
  useApiClient: () => ({
    get: mockGet,
    post: vi.fn(),
    postFormData: vi.fn(),
    del: mockDel,
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

import { useAnalysisPipeline, type AnalysisPipelineOptions } from '../useAnalysisPipeline'

const baseOptions: AnalysisPipelineOptions = {
  module: 'test',
  apiUrl: 'http://localhost:8000',
  statusPath: '/test/{sid}/status',
  resultPath: '/test/{sid}/result',
  cancelPath: '/test/{sid}',
  pollInterval: 2000,
  maxErrors: 3,
}

// localStorage mock for jsdom environments where it may not be fully functional
const localStorageMap = new Map<string, string>()
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageMap.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageMap.set(key, value) }),
  removeItem: vi.fn((key: string) => { localStorageMap.delete(key) }),
  clear: vi.fn(() => { localStorageMap.clear() }),
  get length() { return localStorageMap.size },
  key: vi.fn((index: number) => Array.from(localStorageMap.keys())[index] ?? null),
}

describe('useAnalysisPipeline', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorageMap.clear()
    vi.stubGlobal('localStorage', localStorageMock)
    mockGet.mockReset()
    mockDel.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ── Initial state ──

  it('starts in idle phase with null values', () => {
    const { result } = renderHook(() => useAnalysisPipeline(baseOptions))

    expect(result.current.phase).toBe('idle')
    expect(result.current.sessionId).toBeNull()
    expect(result.current.progress).toBeNull()
    expect(result.current.results).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isCancelled).toBe(false)
    expect(result.current.estimatedRemainingSec).toBeNull()
  })

  // ── setPhase / setSessionId / setError ──

  it('exposes setPhase, setSessionId, setError setters', () => {
    const { result } = renderHook(() => useAnalysisPipeline(baseOptions))

    act(() => { result.current.setPhase('uploading') })
    expect(result.current.phase).toBe('uploading')

    act(() => { result.current.setSessionId('abc') })
    expect(result.current.sessionId).toBe('abc')

    act(() => { result.current.setError('oops') })
    expect(result.current.error).toBe('oops')
  })

  // ── Polling: completed flow ──

  it('polls status then fetches results on completed', async () => {
    const { result } = renderHook(() => useAnalysisPipeline(baseOptions))

    act(() => {
      result.current.setSessionId('s1')
      result.current.setPhase('polling')
    })

    // api.get returns parsed JSON directly
    mockGet
      .mockResolvedValueOnce({ status: 'completed', overall_progress: 100 })
      .mockResolvedValueOnce({ data: [1, 2, 3] })

    act(() => { result.current.startPolling('s1') })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(result.current.phase).toBe('completed')
    expect(result.current.results).toEqual({ data: [1, 2, 3] })
  })

  // ── Polling: error status ──

  it('transitions to error when polling returns error status', async () => {
    const { result } = renderHook(() => useAnalysisPipeline(baseOptions))

    act(() => {
      result.current.setSessionId('s1')
      result.current.setPhase('polling')
    })

    mockGet.mockResolvedValueOnce({ status: 'error', overall_progress: 50, error: 'analysis failed' })

    act(() => { result.current.startPolling('s1') })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(result.current.phase).toBe('error')
    expect(result.current.error).toBe('analysis failed')
  })

  // ── Polling: cancelled status ──

  it('transitions to idle when polling returns cancelled status', async () => {
    const { result } = renderHook(() => useAnalysisPipeline(baseOptions))

    act(() => {
      result.current.setSessionId('s1')
      result.current.setPhase('polling')
    })

    mockGet.mockResolvedValueOnce({ status: 'cancelled', overall_progress: 0 })

    act(() => { result.current.startPolling('s1') })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(result.current.phase).toBe('idle')
    expect(result.current.isCancelled).toBe(true)
  })

  // ── Polling: consecutive fetch errors hit maxErrors ──

  it('transitions to error after maxErrors consecutive fetch failures', async () => {
    const { result } = renderHook(() =>
      useAnalysisPipeline({ ...baseOptions, maxErrors: 2 })
    )

    act(() => {
      result.current.setSessionId('s1')
      result.current.setPhase('polling')
    })

    mockGet
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new Error('network'))

    act(() => { result.current.startPolling('s1') })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    expect(result.current.phase).toBe('polling')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    expect(result.current.phase).toBe('error')
    expect(result.current.error).toContain('2')
  })

  // ── Polling: validateResult rejection ──

  it('rejects completed result when validateResult returns error', async () => {
    const validate = vi.fn().mockReturnValue('invalid data')

    const { result } = renderHook(() =>
      useAnalysisPipeline({ ...baseOptions, validateResult: validate })
    )

    act(() => {
      result.current.setSessionId('s1')
      result.current.setPhase('polling')
    })

    mockGet
      .mockResolvedValueOnce({ status: 'completed', overall_progress: 100 })
      .mockResolvedValueOnce({ bad: true })

    act(() => { result.current.startPolling('s1') })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(result.current.phase).toBe('error')
    expect(result.current.error).toBe('invalid data')
    expect(validate).toHaveBeenCalledWith({ bad: true })
  })

  // ── Polling: result fetch failure ──

  it('sets error when result fetch fails after completed status', async () => {
    const { result } = renderHook(() => useAnalysisPipeline(baseOptions))

    act(() => {
      result.current.setSessionId('s1')
      result.current.setPhase('polling')
    })

    mockGet
      .mockResolvedValueOnce({ status: 'completed', overall_progress: 100 })
      .mockRejectedValueOnce(new Error('fetch failed'))

    act(() => { result.current.startPolling('s1') })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(result.current.phase).toBe('error')
    expect(result.current.error).toContain('결과를 가져올 수 없습니다')
  })

  // ── Cancel ──

  it('cancelAnalysis sends DELETE and resets to idle', async () => {
    mockDel.mockResolvedValue({})

    const { result } = renderHook(() => useAnalysisPipeline(baseOptions))

    act(() => {
      result.current.setSessionId('s1')
      result.current.setPhase('polling')
    })

    await act(async () => {
      await result.current.cancelAnalysis()
    })

    expect(mockDel).toHaveBeenCalledWith('/test/s1')
    expect(result.current.phase).toBe('idle')
    expect(result.current.isCancelled).toBe(true)
  })

  it('cancelAnalysis does nothing when sessionId is null', async () => {
    const { result } = renderHook(() => useAnalysisPipeline(baseOptions))

    await act(async () => {
      await result.current.cancelAnalysis()
    })

    expect(mockDel).not.toHaveBeenCalled()
  })

  // ── Reset ──

  it('reset clears all state back to initial', () => {
    const { result } = renderHook(() => useAnalysisPipeline(baseOptions))

    act(() => {
      result.current.setSessionId('s1')
      result.current.setPhase('polling')
      result.current.setError('old error')
    })

    act(() => { result.current.reset() })

    expect(result.current.phase).toBe('idle')
    expect(result.current.sessionId).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isCancelled).toBe(false)
    expect(result.current.results).toBeNull()
    expect(result.current.progress).toBeNull()
    expect(result.current.estimatedRemainingSec).toBeNull()
  })

  // ── Session persistence: saveSession ──

  it('saveSession persists to localStorage', () => {
    const { result } = renderHook(() => useAnalysisPipeline(baseOptions))

    act(() => { result.current.saveSession('s1', 'polling') })

    const stored = JSON.parse(localStorageMap.get('testPipelineSession')!)
    expect(stored).toEqual({ sessionId: 's1', phase: 'polling' })
  })

  // ── Session recovery on mount ──

  it('restores polling session from localStorage on mount', async () => {
    // Pre-persist a session
    localStorageMap.set('testPipelineSession', JSON.stringify({ sessionId: 's1', phase: 'polling' }))

    // In-progress poll: just keep returning running
    mockGet.mockResolvedValue({ status: 'running', overall_progress: 30 })

    const { result } = renderHook(() => useAnalysisPipeline(baseOptions))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(result.current.sessionId).toBe('s1')
    expect(result.current.phase).toBe('polling')
  })

  it('does not restore session if phase is idle', () => {
    localStorageMap.set('testPipelineSession', JSON.stringify({ sessionId: 's1', phase: 'idle' }))

    const { result } = renderHook(() => useAnalysisPipeline(baseOptions))

    expect(result.current.sessionId).toBeNull()
    expect(result.current.phase).toBe('idle')
  })

  // ── Cleanup on unmount ──

  it('clears polling interval on unmount', async () => {
    mockGet.mockResolvedValue({ status: 'running', overall_progress: 50 })

    const { result, unmount } = renderHook(() => useAnalysisPipeline(baseOptions))

    act(() => {
      result.current.setSessionId('s1')
      result.current.setPhase('polling')
      result.current.startPolling('s1')
    })

    unmount()

    const callCountBeforeAdvance = mockGet.mock.calls.length

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000)
    })

    expect(mockGet.mock.calls.length).toBe(callCountBeforeAdvance)
  })

  // ── ETA calculation ──

  it('calculates estimated remaining seconds during polling', async () => {
    const { result } = renderHook(() => useAnalysisPipeline(baseOptions))

    act(() => {
      result.current.setSessionId('s1')
      result.current.setPhase('polling')
    })

    mockGet.mockResolvedValueOnce({ status: 'running', overall_progress: 50 })

    act(() => { result.current.startPolling('s1') })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(result.current.estimatedRemainingSec).toBeGreaterThan(0)
  })
})
