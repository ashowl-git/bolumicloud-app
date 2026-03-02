import { useState, useCallback, useRef } from 'react'
import type { InteractionMode, SurfaceHit, BaseAnalysisPoint } from './types'
import { threeToBackend, threeNormalToBackend } from './types'

// ─── usePointPlacement ─────────────────────────────
// useMeasurementPlacement의 통합 대체. 완전한 3D 위치 + 법선 저장.

interface UsePointPlacementReturn {
  points: BaseAnalysisPoint[]
  selectedPointId: string | null
  mode: InteractionMode
  hoverHit: SurfaceHit | null
  setMode: (mode: InteractionMode) => void
  addPointFromHit: (hit: SurfaceHit) => void
  removePoint: (id: string) => void
  selectPoint: (id: string | null) => void
  clearPoints: () => void
  setPoints: (points: BaseAnalysisPoint[]) => void
  setHoverHit: (hit: SurfaceHit | null) => void
  handleSurfaceClick: (hit: SurfaceHit) => void
  handlePointClick: (id: string) => void
}

interface UsePointPlacementOptions {
  prefix?: string          // 포인트 ID 접두사 (기본: 'P')
  maxPoints?: number       // 최대 포인트 수 (기본: 무제한)
}

export function usePointPlacement(options: UsePointPlacementOptions = {}): UsePointPlacementReturn {
  const { prefix = 'P', maxPoints } = options

  const [points, setPointsState] = useState<BaseAnalysisPoint[]>([])
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [mode, setModeState] = useState<InteractionMode>('navigate')
  const [hoverHit, setHoverHit] = useState<SurfaceHit | null>(null)
  const nextIdRef = useRef(1)

  const setMode = useCallback((m: InteractionMode) => {
    setModeState(m)
    if (m === 'navigate') setHoverHit(null)
  }, [])

  const addPointFromHit = useCallback((hit: SurfaceHit) => {
    if (maxPoints && points.length >= maxPoints) return

    const id = `${prefix}${nextIdRef.current++}`
    const backend = threeToBackend(hit.point[0], hit.point[1], hit.point[2])
    const backendNormal = threeNormalToBackend(hit.normal[0], hit.normal[1], hit.normal[2])

    const point: BaseAnalysisPoint = {
      id,
      name: id,
      position: backend,
      threePosition: hit.point,
      surfaceType: hit.surfaceType,
      normal: backendNormal,
    }

    setPointsState((prev) => [...prev, point])
    setSelectedPointId(id)
  }, [prefix, maxPoints, points.length])

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

  const setPoints = useCallback((pts: BaseAnalysisPoint[]) => {
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

  // 통합 클릭 핸들러: 모드에 따라 포인트 추가/선택/삭제
  const handleSurfaceClick = useCallback((hit: SurfaceHit) => {
    if (mode === 'place_point' || mode === 'place_area') {
      addPointFromHit(hit)
    }
  }, [mode, addPointFromHit])

  const handlePointClick = useCallback((id: string) => {
    if (mode === 'delete') {
      removePoint(id)
    } else {
      selectPoint(id)
    }
  }, [mode, removePoint, selectPoint])

  return {
    points,
    selectedPointId,
    mode,
    hoverHit,
    setMode,
    addPointFromHit,
    removePoint,
    selectPoint,
    clearPoints,
    setPoints,
    setHoverHit,
    handleSurfaceClick,
    handlePointClick,
  }
}
