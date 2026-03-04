import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'

// Mock useBackendHealth before importing ApiContext
vi.mock('@/components/BoLumiCloud/hooks/useBackendHealth', () => ({
  useBackendHealth: vi.fn().mockReturnValue({
    backendStatus: 'healthy',
    backendInfo: { pyradiance_version: '1.0', cpu_count: 4, status: 'ok' },
  }),
}))

import { ApiProvider, useApi } from '../ApiContext'
import { useBackendHealth } from '@/components/BoLumiCloud/hooks/useBackendHealth'

describe('ApiContext', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL

  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.NEXT_PUBLIC_API_URL
  })

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_API_URL = originalEnv
    } else {
      delete process.env.NEXT_PUBLIC_API_URL
    }
  })

  // ── Provider renders children ──

  it('renders children within provider', () => {
    const { result } = renderHook(() => useApi(), {
      wrapper: ({ children }) => <ApiProvider>{children}</ApiProvider>,
    })

    expect(result.current).toBeDefined()
    expect(result.current.apiUrl).toBeDefined()
  })

  // ── Throws outside provider ──

  it('throws when useApi is used outside ApiProvider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useApi())
    }).toThrow('useApi must be used within an ApiProvider')

    spy.mockRestore()
  })

  // ── apiUrl resolution: prop takes priority ──

  it('uses prop apiUrl when provided', () => {
    const { result } = renderHook(() => useApi(), {
      wrapper: ({ children }) => <ApiProvider apiUrl="http://custom:9000">{children}</ApiProvider>,
    })

    expect(result.current.apiUrl).toBe('http://custom:9000')
    expect(useBackendHealth).toHaveBeenCalledWith('http://custom:9000')
  })

  // ── apiUrl resolution: env variable ──

  it('uses NEXT_PUBLIC_API_URL env when no prop', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://env:7000'

    const { result } = renderHook(() => useApi(), {
      wrapper: ({ children }) => <ApiProvider>{children}</ApiProvider>,
    })

    expect(result.current.apiUrl).toBe('http://env:7000')
  })

  // ── apiUrl resolution: fallback ──

  it('falls back to https://api.askwhy.works when no prop and no env', () => {
    const { result } = renderHook(() => useApi(), {
      wrapper: ({ children }) => <ApiProvider>{children}</ApiProvider>,
    })

    expect(result.current.apiUrl).toBe('https://api.askwhy.works')
  })

  // ── backendStatus and backendInfo are passed through ──

  it('provides backendStatus and backendInfo from useBackendHealth', () => {
    const { result } = renderHook(() => useApi(), {
      wrapper: ({ children }) => <ApiProvider>{children}</ApiProvider>,
    })

    expect(result.current.backendStatus).toBe('healthy')
    expect(result.current.backendInfo).toEqual({
      pyradiance_version: '1.0',
      cpu_count: 4,
      status: 'ok',
    })
  })

  // ── unhealthy backend ──

  it('reflects unhealthy backend status', () => {
    vi.mocked(useBackendHealth).mockReturnValue({
      backendStatus: 'unhealthy',
      backendInfo: null,
    })

    const { result } = renderHook(() => useApi(), {
      wrapper: ({ children }) => <ApiProvider>{children}</ApiProvider>,
    })

    expect(result.current.backendStatus).toBe('unhealthy')
    expect(result.current.backendInfo).toBeNull()
  })
})
