'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { backendToThree } from '@/components/shared/3d/interaction/types'

interface WallDataPoint {
  x: number
  y: number
  z: number
  nx: number
  ny: number
  nz: number
  total_hours: number
  continuous_hours: number
}

function hoursToColor(hours: number, maxHours: number): THREE.Color {
  const t = Math.min(Math.max(hours / maxHours, 0), 1)
  let r: number, g: number, b: number
  if (t < 0.5) {
    r = 239; g = Math.round(68 + t * 2 * (163 - 68)); b = 68
  } else {
    r = Math.round(239 - (t - 0.5) * 2 * (239 - 34))
    g = Math.round(163 + (t - 0.5) * 2 * (197 - 163))
    b = Math.round(34 + (t - 0.5) * 2 * (94 - 34))
  }
  return new THREE.Color(r / 255, g / 255, b / 255)
}

interface WallHeatmapProps {
  wallData: WallDataPoint[]
  maxHours?: number
  pointSize?: number
}

export default function WallHeatmap({
  wallData,
  maxHours = 8,
  pointSize = 0.3,
}: WallHeatmapProps) {
  const { positions, colors } = useMemo(() => {
    const count = wallData.length
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const d = wallData[i]
      const [tx, ty, tz] = backendToThree(d.x, d.y, d.z)
      positions[i * 3] = tx
      positions[i * 3 + 1] = ty
      positions[i * 3 + 2] = tz

      const color = hoursToColor(d.total_hours, maxHours)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    return { positions, colors }
  }, [wallData, maxHours])

  if (wallData.length === 0) return null

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={wallData.length}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          count={wallData.length}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={pointSize}
        vertexColors
        transparent
        opacity={0.8}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
