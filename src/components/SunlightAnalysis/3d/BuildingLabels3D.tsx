'use client'

import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import type { BuildingInfo } from '@/lib/types/sunlight'
import { backendToThree } from '@/components/shared/3d/interaction/types'

interface BuildingLabels3DProps {
  buildings: BuildingInfo[]
  selectedBuildingId: string | null
  onBuildingClick?: (id: string) => void
}

export default function BuildingLabels3D({
  buildings,
  selectedBuildingId,
  onBuildingClick,
}: BuildingLabels3DProps) {
  const labels = useMemo(() => {
    return buildings.map((b) => {
      const [minX, minY, minZ] = backendToThree(b.bbox_min[0], b.bbox_min[1], b.bbox_min[2])
      const [maxX, maxY, maxZ] = backendToThree(b.bbox_max[0], b.bbox_max[1], b.bbox_max[2])

      // 건물 상단 중앙에 레이블 배치
      const centerX = (Math.min(minX, maxX) + Math.max(minX, maxX)) / 2
      const topY = Math.max(minY, maxY) + 1.5 // 건물 상단 약간 위
      const centerZ = (Math.min(minZ, maxZ) + Math.max(minZ, maxZ)) / 2

      return {
        id: b.building_id,
        position: [centerX, topY, centerZ] as [number, number, number],
        height: b.height,
        isSelected: b.building_id === selectedBuildingId,
      }
    })
  }, [buildings, selectedBuildingId])

  if (labels.length === 0) return null

  return (
    <group>
      {labels.map((label) => (
        <Html
          key={label.id}
          position={label.position}
          center
          distanceFactor={80}
          style={{ pointerEvents: 'auto' }}
        >
          <button
            onClick={() => onBuildingClick?.(label.id)}
            className={`px-1.5 py-0.5 text-[10px] font-mono font-medium rounded shadow-sm
              whitespace-nowrap select-none transition-all cursor-pointer
              ${label.isSelected
                ? 'bg-red-600 text-white ring-2 ring-red-300 scale-110'
                : 'bg-white/90 text-gray-700 border border-gray-300 hover:bg-red-50 hover:border-red-400 hover:text-red-600'
              }`}
          >
            {label.id}
            <span className="ml-1 text-[9px] opacity-70">{label.height.toFixed(0)}m</span>
          </button>
        </Html>
      ))}
    </group>
  )
}
