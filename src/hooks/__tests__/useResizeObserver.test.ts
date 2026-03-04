import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useResizeObserver } from '../useResizeObserver'
import { type RefObject } from 'react'

describe('useResizeObserver', () => {
  let mockObserve: ReturnType<typeof vi.fn>
  let mockDisconnect: ReturnType<typeof vi.fn>
  let capturedCallback: ResizeObserverCallback

  beforeEach(() => {
    mockObserve = vi.fn()
    mockDisconnect = vi.fn()

    // Use a class to satisfy `new ResizeObserver(cb)` constructor call
    class MockResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        capturedCallback = cb
      }
      observe = mockObserve
      disconnect = mockDisconnect
      unobserve = vi.fn()
    }

    vi.stubGlobal('ResizeObserver', MockResizeObserver)
  })

  it('returns initial size of {width: 0, height: 0}', () => {
    const ref = { current: null } as RefObject<HTMLElement | null>
    const { result } = renderHook(() => useResizeObserver(ref))

    expect(result.current).toEqual({ width: 0, height: 0 })
  })

  it('does not observe when ref.current is null', () => {
    const ref = { current: null } as RefObject<HTMLElement | null>
    renderHook(() => useResizeObserver(ref))

    expect(mockObserve).not.toHaveBeenCalled()
  })

  it('observes the element when ref.current is set', () => {
    const el = document.createElement('div')
    const ref = { current: el } as RefObject<HTMLElement | null>
    renderHook(() => useResizeObserver(ref))

    expect(mockObserve).toHaveBeenCalledWith(el)
  })

  it('disconnects on unmount', () => {
    const el = document.createElement('div')
    const ref = { current: el } as RefObject<HTMLElement | null>
    const { unmount } = renderHook(() => useResizeObserver(ref))

    unmount()

    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('updates size when ResizeObserver fires', () => {
    const el = document.createElement('div')
    const ref = { current: el } as RefObject<HTMLElement | null>
    const { result } = renderHook(() => useResizeObserver(ref))

    // Simulate a resize event inside act() to flush state updates
    const entries = [
      { contentRect: { width: 300, height: 200 } },
    ] as unknown as ResizeObserverEntry[]
    act(() => {
      capturedCallback(entries, {} as ResizeObserver)
    })

    expect(result.current).toEqual({ width: 300, height: 200 })
  })
})
