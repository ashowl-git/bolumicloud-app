import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPostFormData = vi.fn()
const mockDel = vi.fn()

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    useApiClient: () => ({
      get: mockGet,
      post: mockPost,
      postFormData: mockPostFormData,
      del: mockDel,
      downloadBlob: vi.fn(),
      getBlob: vi.fn(),
      postBlob: vi.fn(),
    }),
  }
})

vi.mock('@/contexts/ApiContext', () => ({
  useApi: () => ({
    apiUrl: 'http://localhost:8000',
    backendStatus: 'healthy' as const,
    backendInfo: null,
  }),
}))

// Mock logger to suppress output
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

import { useSunlightPipeline } from '../useSunlightPipeline'

const API_URL = 'http://localhost:8000'

describe('useSunlightPipeline', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Clear localStorage items used by the hook
    try { window.localStorage.removeItem('sunlightPipelineSession') } catch { /* ignore */ }
    mockGet.mockReset()
    mockPost.mockReset()
    mockPostFormData.mockReset()
    mockDel.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('starts in idle phase', () => {
    const { result } = renderHook(() => useSunlightPipeline({ apiUrl: API_URL }))
    expect(result.current.phase).toBe('idle')
    expect(result.current.sessionId).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('transitions to uploading then idle on successful OBJ upload', async () => {
    // OBJ upload: first postFormData for /import/obj, second for /sunlight/upload
    mockPostFormData
      .mockResolvedValueOnce({ model_id: 'model-1', scene_url: '/scene/1.glb' })
      .mockResolvedValueOnce({ session_id: 'session-1' })

    const { result } = renderHook(() => useSunlightPipeline({ apiUrl: API_URL }))

    const file = new File(['test'], 'model.obj', { type: 'text/plain' })

    await act(async () => {
      await result.current.uploadFile(file)
    })

    expect(result.current.phase).toBe('idle')
    expect(result.current.sessionId).toBe('session-1')
    expect(result.current.modelId).toBe('model-1')
  })

  it('transitions to error on upload failure', async () => {
    mockPostFormData.mockRejectedValueOnce(new Error('OBJ import failed'))

    const { result } = renderHook(() => useSunlightPipeline({ apiUrl: API_URL }))
    const file = new File(['test'], 'model.obj', { type: 'text/plain' })

    await act(async () => {
      await result.current.uploadFile(file)
    })

    expect(result.current.phase).toBe('error')
    expect(result.current.error).toBe('OBJ import failed')
  })

  it('transitions through running -> polling -> completed', async () => {
    const { result } = renderHook(() => useSunlightPipeline({ apiUrl: API_URL }))

    // Upload OBJ
    mockPostFormData
      .mockResolvedValueOnce({ model_id: 'model-1', scene_url: '/scene/1.glb' })
      .mockResolvedValueOnce({ session_id: 'session-1' })

    const file = new File(['test'], 'model.obj', { type: 'text/plain' })
    await act(async () => {
      await result.current.uploadFile(file)
    })
    expect(result.current.sessionId).toBe('session-1')

    // Run analysis (api.post)
    mockPost.mockResolvedValueOnce({ status: 'running' })

    const config = {
      latitude: 37.5665,
      longitude: 126.978,
      analysis_date: '2024-12-21',
      grid_size: 1.0,
    }

    await act(async () => {
      await result.current.runAnalysis(config as never)
    })

    expect(result.current.phase).toBe('polling')

    // Poll status (api.get) -> completed, then fetch result (api.get)
    mockGet
      .mockResolvedValueOnce({ status: 'completed', overall_progress: 100 })
      .mockResolvedValueOnce({ points: [{ x: 0, y: 0, hours: 4 }] })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(result.current.phase).toBe('completed')
    expect(result.current.results).toEqual({
      points: [{ x: 0, y: 0, hours: 4 }],
    })
  })

  it('transitions to error when polling returns error status', async () => {
    const { result } = renderHook(() => useSunlightPipeline({ apiUrl: API_URL }))

    // Upload
    mockPostFormData
      .mockResolvedValueOnce({ model_id: 'model-1', scene_url: '/scene/1.glb' })
      .mockResolvedValueOnce({ session_id: 'session-1' })

    const file = new File(['test'], 'model.obj', { type: 'text/plain' })
    await act(async () => {
      await result.current.uploadFile(file)
    })

    // Run
    mockPost.mockResolvedValueOnce({ status: 'running' })

    await act(async () => {
      await result.current.runAnalysis({ latitude: 37.5 } as never)
    })

    // Poll returns error
    mockGet.mockResolvedValueOnce({
      status: 'error',
      error: '분석 오류',
      overall_progress: 50,
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(result.current.phase).toBe('error')
    expect(result.current.error).toBe('분석 오류')
  })

  it('resets all state', async () => {
    const { result } = renderHook(() => useSunlightPipeline({ apiUrl: API_URL }))

    // Upload to get some state
    mockPostFormData
      .mockResolvedValueOnce({ model_id: 'model-1', scene_url: '/scene/1.glb' })
      .mockResolvedValueOnce({ session_id: 'session-1' })

    const file = new File(['test'], 'model.obj', { type: 'text/plain' })
    await act(async () => {
      await result.current.uploadFile(file)
    })

    expect(result.current.sessionId).toBe('session-1')

    act(() => {
      result.current.reset()
    })

    expect(result.current.phase).toBe('idle')
    expect(result.current.sessionId).toBeNull()
    expect(result.current.modelId).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.results).toBeNull()
  })
})
