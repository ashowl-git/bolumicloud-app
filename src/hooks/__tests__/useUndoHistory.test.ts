import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUndoHistory } from '../useUndoHistory'

describe('useUndoHistory', () => {
  // ── Initial state ──

  it('starts with the initial value', () => {
    const { result } = renderHook(() => useUndoHistory('A'))
    expect(result.current.current).toBe('A')
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  // ── Push ──

  it('push updates current and enables undo', () => {
    const { result } = renderHook(() => useUndoHistory('A'))

    act(() => result.current.push('B'))

    expect(result.current.current).toBe('B')
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
  })

  it('push clears the redo stack', () => {
    const { result } = renderHook(() => useUndoHistory('A'))

    act(() => result.current.push('B'))
    act(() => result.current.push('C'))
    act(() => result.current.undo())
    expect(result.current.canRedo).toBe(true)

    act(() => result.current.push('D'))
    expect(result.current.canRedo).toBe(false)
    expect(result.current.current).toBe('D')
  })

  // ── Undo ──

  it('undo reverts to previous state', () => {
    const { result } = renderHook(() => useUndoHistory('A'))

    act(() => result.current.push('B'))
    act(() => result.current.undo())

    expect(result.current.current).toBe('A')
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(true)
  })

  it('undo does nothing when past is empty', () => {
    const { result } = renderHook(() => useUndoHistory('A'))

    act(() => result.current.undo())

    expect(result.current.current).toBe('A')
    expect(result.current.canUndo).toBe(false)
  })

  // ── Redo ──

  it('redo re-applies undone state', () => {
    const { result } = renderHook(() => useUndoHistory('A'))

    act(() => result.current.push('B'))
    act(() => result.current.undo())
    act(() => result.current.redo())

    expect(result.current.current).toBe('B')
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
  })

  it('redo does nothing when future is empty', () => {
    const { result } = renderHook(() => useUndoHistory('A'))

    act(() => result.current.redo())

    expect(result.current.current).toBe('A')
    expect(result.current.canRedo).toBe(false)
  })

  // ── Multiple undo/redo ──

  it('supports multiple undo and redo steps', () => {
    const { result } = renderHook(() => useUndoHistory(1))

    act(() => result.current.push(2))
    act(() => result.current.push(3))
    act(() => result.current.push(4))

    act(() => result.current.undo())
    expect(result.current.current).toBe(3)

    act(() => result.current.undo())
    expect(result.current.current).toBe(2)

    act(() => result.current.redo())
    expect(result.current.current).toBe(3)

    act(() => result.current.redo())
    expect(result.current.current).toBe(4)
  })

  // ── maxSteps ──

  it('respects maxSteps by pruning oldest entries', () => {
    const { result } = renderHook(() => useUndoHistory(0, 3))

    act(() => result.current.push(1))
    act(() => result.current.push(2))
    act(() => result.current.push(3))
    act(() => result.current.push(4)) // oldest (0) should be pruned

    // Undo back: 4 -> 3 -> 2 -> 1, but 0 should not be reachable
    act(() => result.current.undo())
    expect(result.current.current).toBe(3)

    act(() => result.current.undo())
    expect(result.current.current).toBe(2)

    act(() => result.current.undo())
    expect(result.current.current).toBe(1)

    // Cannot undo further - 0 was pruned
    expect(result.current.canUndo).toBe(false)
  })

  // ── Reset ──

  it('reset clears all history and sets new initial', () => {
    const { result } = renderHook(() => useUndoHistory('A'))

    act(() => result.current.push('B'))
    act(() => result.current.push('C'))

    act(() => result.current.reset('X'))

    expect(result.current.current).toBe('X')
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  // ── Object state (deep clone) ──

  it('deep clones pushed state (structuredClone)', () => {
    const { result } = renderHook(() => useUndoHistory({ count: 0 }))

    const obj = { count: 1 }
    act(() => result.current.push(obj))

    // Mutating the original should not affect stored state
    obj.count = 999

    expect(result.current.current.count).toBe(1)
  })
})
