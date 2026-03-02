'use client'

import { useCallback, useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { BoundingBox } from '../types'
import type { SurfaceHit } from './types'

// ─── InteractiveGround ─────────────────────────────
// 지면 클릭 감지 평면. bbox 기반 크기 자동 조정.

interface InteractiveGroundProps {
  bbox: BoundingBox | null
  enabled?: boolean
  onGroundHover?: (hit: SurfaceHit | null) => void
  onGroundClick?: (hit: SurfaceHit) => void
}

export default function InteractiveGround({
  bbox,
  enabled = true,
  onGroundHover,
  onGroundClick,
}: InteractiveGroundProps) {
  // bbox 기반 크기 (최소 100x100, 양쪽으로 50% 여유)
  const planeSize = useMemo(() => {
    if (!bbox) return 500
    const maxSpan = Math.max(bbox.size[0], bbox.size[2]) // X, Z 스팬
    return Math.max(100, maxSpan * 3)
  }, [bbox])

  const buildHit = useCallback((e: ThreeEvent<PointerEvent | MouseEvent>): SurfaceHit => {
    return {
      point: [e.point.x, e.point.y, e.point.z],
      normal: [0, 1, 0], // 지면 법선은 항상 Y-up
      faceIndex: e.faceIndex ?? -1,
      objectName: 'ground_plane',
      surfaceType: 'ground',
      distance: e.distance,
    }
  }, [])

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!enabled) return
    e.stopPropagation()
    onGroundHover?.(buildHit(e))
  }, [enabled, onGroundHover, buildHit])

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (!enabled) return
    e.stopPropagation()
    onGroundClick?.(buildHit(e))
  }, [enabled, onGroundClick, buildHit])

  const handlePointerLeave = useCallback(() => {
    onGroundHover?.(null)
  }, [onGroundHover])

  if (!enabled) return null

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.01, 0]}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      onPointerLeave={handlePointerLeave}
      visible={false}
    >
      <planeGeometry args={[planeSize, planeSize]} />
      <meshBasicMaterial side={THREE.DoubleSide} />
    </mesh>
  )
}
