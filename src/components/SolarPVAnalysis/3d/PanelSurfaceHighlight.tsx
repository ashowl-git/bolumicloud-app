'use client'

import { useMemo, useCallback } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { PanelSurfaceInfo } from '@/lib/types/solar-pv'
import { backendToThree, backendNormalToThree } from '@/components/shared/3d/interaction/types'

// ─── PanelSurfaceHighlight ────────────────────
// 패널 표면을 3D 씬에서 반투명 평면으로 하이라이트 표시.
// 선택된 표면은 노란색, 나머지는 파란색으로 렌더링.

interface PanelSurfaceHighlightProps {
  surfaces: PanelSurfaceInfo[]
  selectedSurfaceId: string | null
  onSurfaceClick: (surfaceId: string) => void
}

// ─── 법선 벡터로 회전 쿼터니언 계산 ──────────────

function normalToQuaternion(normal: [number, number, number]): THREE.Quaternion {
  const n = new THREE.Vector3(...normal).normalize()
  const up = new THREE.Vector3(0, 0, 1) // planeGeometry 기본 법선 = +Z
  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(up, n)
  return quaternion
}

// ─── 색상 상수 ─────────────────────────────────

const COLOR_DEFAULT = '#3b82f6'   // blue-500
const COLOR_SELECTED = '#eab308'  // yellow-500
const OPACITY_DEFAULT = 0.4
const OPACITY_SELECTED = 0.6

export default function PanelSurfaceHighlight({
  surfaces,
  selectedSurfaceId,
  onSurfaceClick,
}: PanelSurfaceHighlightProps) {
  const cells = useMemo(() => {
    return surfaces.map((s) => {
      const [tx, ty, tz] = backendToThree(s.center[0], s.center[1], s.center[2])
      const threeNormal = backendNormalToThree(s.normal[0], s.normal[1], s.normal[2])
      const quaternion = normalToQuaternion(threeNormal)
      const euler = new THREE.Euler().setFromQuaternion(quaternion)

      // 면적 기반 정사각형 크기 (sqrt로 한 변 추정)
      const side = Math.sqrt(s.area_m2)

      return {
        surfaceId: s.surface_id,
        position: [tx, ty, tz] as [number, number, number],
        rotation: [euler.x, euler.y, euler.z] as [number, number, number],
        size: side,
        isSelected: s.surface_id === selectedSurfaceId,
      }
    })
  }, [surfaces, selectedSurfaceId])

  const handleClick = useCallback(
    (surfaceId: string) => (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      onSurfaceClick(surfaceId)
    },
    [onSurfaceClick],
  )

  if (cells.length === 0) return null

  return (
    <group>
      {cells.map((cell) => (
        <mesh
          key={cell.surfaceId}
          position={cell.position}
          rotation={cell.rotation}
          onClick={handleClick(cell.surfaceId)}
        >
          <planeGeometry args={[cell.size, cell.size]} />
          <meshStandardMaterial
            color={cell.isSelected ? COLOR_SELECTED : COLOR_DEFAULT}
            transparent
            opacity={cell.isSelected ? OPACITY_SELECTED : OPACITY_DEFAULT}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
