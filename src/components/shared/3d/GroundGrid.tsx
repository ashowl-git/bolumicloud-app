'use client'

import { useMemo } from 'react'
import type { BoundingBox } from './types'

interface GroundGridProps {
  bbox?: BoundingBox | null
  size?: number
  divisions?: number
}

export default function GroundGrid({
  bbox,
  size: overrideSize,
  divisions: overrideDivisions,
}: GroundGridProps) {
  const { gridSize, divisions, shadowPlaneSize } = useMemo(() => {
    if (overrideSize) {
      return { gridSize: overrideSize, divisions: overrideDivisions ?? 20, shadowPlaneSize: overrideSize * 3 }
    }
    if (!bbox) return { gridSize: 100, divisions: 20, shadowPlaneSize: 500 }

    const maxSpan = Math.max(bbox.size[0], bbox.size[2]) * 2.5
    const snap = Math.ceil(maxSpan / 10) * 10
    // Shadow plane must be much larger than grid to capture all shadows
    const horizDiag = Math.sqrt(bbox.size[0] ** 2 + bbox.size[2] ** 2)
    return {
      gridSize: Math.max(snap, 50),
      divisions: Math.max(snap / 5, 10),
      shadowPlaneSize: Math.max(horizDiag * 6, snap * 3),
    }
  }, [bbox, overrideSize, overrideDivisions])

  return (
    <group>
      <gridHelper
        args={[gridSize, divisions, '#e2e8f0', '#f1f5f9']}
        position={[0, -0.01, 0]}
      />
      {/* Shadow-receiving plane — much larger than visible grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[shadowPlaneSize, shadowPlaneSize]} />
        <shadowMaterial opacity={0.45} />
      </mesh>
    </group>
  )
}
