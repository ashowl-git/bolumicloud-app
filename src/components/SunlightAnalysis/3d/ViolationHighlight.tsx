'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import type { BlockerInfo } from '@/lib/types/sunlight'
import { backendToThree } from '@/components/shared/3d/interaction/types'

// ─── ViolationHighlight ─────────────────────
// 위반 원인 건물에 빨간 와이어프레임 박스를 렌더링한다.

interface ViolationHighlightProps {
  blockers: BlockerInfo[]
  selectedBuildingId: string | null
}

export default function ViolationHighlight({
  blockers,
  selectedBuildingId,
}: ViolationHighlightProps) {
  const boxes = useMemo(() => {
    return blockers.map((b) => {
      const [minX, minY, minZ] = backendToThree(b.bbox_min[0], b.bbox_min[1], b.bbox_min[2])
      const [maxX, maxY, maxZ] = backendToThree(b.bbox_max[0], b.bbox_max[1], b.bbox_max[2])

      // Three.js에서 min/max가 뒤집힐 수 있으므로 보정
      const tMinX = Math.min(minX, maxX)
      const tMinY = Math.min(minY, maxY)
      const tMinZ = Math.min(minZ, maxZ)
      const tMaxX = Math.max(minX, maxX)
      const tMaxY = Math.max(minY, maxY)
      const tMaxZ = Math.max(minZ, maxZ)

      return {
        id: b.building_id,
        width: tMaxX - tMinX,
        height: tMaxY - tMinY,
        depth: tMaxZ - tMinZ,
        center: [
          (tMinX + tMaxX) / 2,
          (tMinY + tMaxY) / 2,
          (tMinZ + tMaxZ) / 2,
        ] as [number, number, number],
        isSelected: b.building_id === selectedBuildingId,
        percentage: b.shadow_percentage,
      }
    })
  }, [blockers, selectedBuildingId])

  if (boxes.length === 0) return null

  return (
    <group>
      {boxes.map((box) => (
        <group key={box.id} position={box.center}>
          {/* 와이어프레임 박스 */}
          <mesh>
            <boxGeometry args={[box.width, box.height, box.depth]} />
            <meshBasicMaterial
              color="#dc2626"
              wireframe
              transparent
              opacity={box.isSelected ? 0.8 : 0.4}
            />
          </mesh>

          {/* 반투명 면 (선택 시) */}
          {box.isSelected && (
            <mesh>
              <boxGeometry args={[box.width, box.height, box.depth]} />
              <meshBasicMaterial
                color="#dc2626"
                transparent
                opacity={0.1}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}
