import { useState, useCallback, useRef } from 'react'
import type { MeasurementPoint } from '@/lib/types/sunlight'

// ─── 배치 모드 ─────────────────────────────

export type PlacementMode = 'view' | 'add' | 'delete'

// 좌표 변환은 @/components/shared/3d/interaction/types 에서 import

// ─── useMeasurementPlacement ────────────────

interface UseMeasurementPlacementReturn {
  points: MeasurementPoint[]
  selectedPointId: string | null
  mode: PlacementMode
  setMode: (mode: PlacementMode) => void
  addPoint: (threeX: number, threeY: number, threeZ: number) => void
  removePoint: (id: string) => void
  selectPoint: (id: string | null) => void
  clearPoints: () => void
  setPoints: (points: MeasurementPoint[]) => void
}

export function useMeasurementPlacement(): UseMeasurementPlacementReturn {
  const [points, setPointsState] = useState<MeasurementPoint[]>([])
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [mode, setMode] = useState<PlacementMode>('view')
  const nextIdRef = useRef(1)

  const addPoint = useCallback((threeX: number, threeY: number, threeZ: number) => {
    const id = `P${nextIdRef.current++}`
    // Three.js(X=동, Y=위, Z=북) → Backend(X=동, Y=북, Z=위)
    const point: MeasurementPoint = {
      id,
      x: threeX,    // Backend x (East) = Three.js x
      y: threeZ,    // Backend y (North) = Three.js z
      z: threeY,    // Backend z (Up) = Three.js y
      name: id,
    }
    setPointsState((prev) => [...prev, point])
    setSelectedPointId(id)
  }, [])

  const removePoint = useCallback((id: string) => {
    setPointsState((prev) => prev.filter((p) => p.id !== id))
    setSelectedPointId((prev) => (prev === id ? null : prev))
  }, [])

  const selectPoint = useCallback((id: string | null) => {
    setSelectedPointId(id)
  }, [])

  const clearPoints = useCallback(() => {
    setPointsState([])
    setSelectedPointId(null)
    nextIdRef.current = 1
  }, [])

  const setPoints = useCallback((pts: MeasurementPoint[]) => {
    setPointsState(pts)
    if (pts.length > 0) {
      const maxNum = Math.max(
        ...pts.map((p) => {
          const match = p.id.match(/\d+/)
          return match ? parseInt(match[0]) : 0
        }),
      )
      nextIdRef.current = maxNum + 1
    }
  }, [])

  return {
    points,
    selectedPointId,
    mode,
    setMode,
    addPoint,
    removePoint,
    selectPoint,
    clearPoints,
    setPoints,
  }
}
