import { useState, useCallback, useRef } from 'react'
import type { SurfaceHit, BaseAnalysisPoint } from './types'
import { threeToBackend } from './types'

// ─── useAreaPlacement ─────────────────────────────
// 두 번 클릭으로 사각 영역 정의 -> 격자 포인트 자동 생성

export interface AreaDefinition {
  corner1: [number, number, number]  // Three.js 좌표
  corner2: [number, number, number]  // Three.js 좌표
}

interface UseAreaPlacementReturn {
  firstCorner: [number, number, number] | null
  previewCorner: [number, number, number] | null
  area: AreaDefinition | null
  gridSpacing: number
  gridPoints: BaseAnalysisPoint[]
  isPlacing: boolean
  setGridSpacing: (spacing: number) => void
  handleAreaClick: (hit: SurfaceHit) => void
  handleAreaHover: (hit: SurfaceHit | null) => void
  generateGrid: () => BaseAnalysisPoint[]
  resetArea: () => void
}

export function useAreaPlacement(prefix = 'G'): UseAreaPlacementReturn {
  const [firstCorner, setFirstCorner] = useState<[number, number, number] | null>(null)
  const [previewCorner, setPreviewCorner] = useState<[number, number, number] | null>(null)
  const [area, setArea] = useState<AreaDefinition | null>(null)
  const [gridSpacing, setGridSpacing] = useState(2) // 기본 2m 간격
  const [gridPoints, setGridPoints] = useState<BaseAnalysisPoint[]>([])
  const nextIdRef = useRef(1)

  const isPlacing = firstCorner !== null && area === null

  const handleAreaClick = useCallback((hit: SurfaceHit) => {
    if (hit.surfaceType !== 'ground') return // 영역은 지면만

    if (!firstCorner) {
      // 첫 번째 코너
      setFirstCorner(hit.point)
    } else if (!area) {
      // 두 번째 코너 -> 영역 확정
      setArea({ corner1: firstCorner, corner2: hit.point })
      setPreviewCorner(null)
    }
  }, [firstCorner, area])

  const handleAreaHover = useCallback((hit: SurfaceHit | null) => {
    if (!firstCorner || area) return
    if (!hit || hit.surfaceType !== 'ground') {
      setPreviewCorner(null)
      return
    }
    setPreviewCorner(hit.point)
  }, [firstCorner, area])

  const generateGrid = useCallback((): BaseAnalysisPoint[] => {
    if (!area) return []

    const { corner1, corner2 } = area
    const minX = Math.min(corner1[0], corner2[0])
    const maxX = Math.max(corner1[0], corner2[0])
    const minZ = Math.min(corner1[2], corner2[2])
    const maxZ = Math.max(corner1[2], corner2[2])
    const y = (corner1[1] + corner2[1]) / 2 // 평균 높이 (지면)

    const points: BaseAnalysisPoint[] = []
    const spacing = Math.max(0.5, gridSpacing) // 최소 0.5m

    for (let x = minX; x <= maxX; x += spacing) {
      for (let z = minZ; z <= maxZ; z += spacing) {
        const id = `${prefix}${nextIdRef.current++}`
        const backend = threeToBackend(x, y, z)
        points.push({
          id,
          name: id,
          position: backend,
          threePosition: [x, y, z],
          surfaceType: 'ground',
          normal: { dx: 0, dy: 0, dz: 1 }, // 지면 법선 (백엔드: Z-up)
        })
      }
    }

    setGridPoints(points)
    return points
  }, [area, gridSpacing, prefix])

  const resetArea = useCallback(() => {
    setFirstCorner(null)
    setPreviewCorner(null)
    setArea(null)
    setGridPoints([])
  }, [])

  return {
    firstCorner,
    previewCorner,
    area,
    gridSpacing,
    gridPoints,
    isPlacing,
    setGridSpacing,
    handleAreaClick,
    handleAreaHover,
    generateGrid,
    resetArea,
  }
}
