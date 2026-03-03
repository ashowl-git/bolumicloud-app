'use client'

import { useState, useCallback } from 'react'

interface UndoHistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

interface UseUndoHistoryReturn<T> {
  current: T
  push: (state: T) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  reset: (initial: T) => void
}

export function useUndoHistory<T>(
  initial: T,
  maxSteps: number = 50,
): UseUndoHistoryReturn<T> {
  const [history, setHistory] = useState<UndoHistoryState<T>>({
    past: [],
    present: initial,
    future: [],
  })

  const push = useCallback((newState: T) => {
    setHistory((prev) => {
      const newPast = [...prev.past, prev.present]
      if (newPast.length > maxSteps) {
        newPast.splice(0, newPast.length - maxSteps)
      }
      return {
        past: newPast,
        present: structuredClone(newState),
        future: [],
      }
    })
  }, [maxSteps])

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev
      const newPast = [...prev.past]
      const previous = newPast.pop()!
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev
      const newFuture = [...prev.future]
      const next = newFuture.shift()!
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      }
    })
  }, [])

  const reset = useCallback((newInitial: T) => {
    setHistory({
      past: [],
      present: structuredClone(newInitial),
      future: [],
    })
  }, [])

  return {
    current: history.present,
    push,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    reset,
  }
}
