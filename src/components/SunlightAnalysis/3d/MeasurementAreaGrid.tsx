'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import type { PointSunlightResult } from '@/lib/types/sunlight'
import { backendToThree } from '@/components/shared/3d/interaction/types'

// ─── 색상 보간: 일조시간 → 색상 ──────────────

function hoursToColor(hours: number, maxHours: number): string {
  const t = Math.min(Math.max(hours / maxHours, 0), 1)
  const clamp = (v: number) => Math.round(Math.max(0, Math.min(255, v)))

  // red(0h) → amber(2h) → yellow(4h) → lime(6h) → green(8h)
  if (t < 0.5) {
    const r = 239
    const g = clamp(68 + t * 2 * (163 - 68))
    const b = 68
    return `rgb(${r},${g},${b})`
  }
  const r = clamp(239 - (t - 0.5) * 2 * (239 - 34))
  const g = clamp(163 + (t - 0.5) * 2 * (197 - 163))
  const b = clamp(34 + (t - 0.5) * 2 * (94 - 34))
  return `rgb(${r},${g},${b})`
}

// ─── MeasurementAreaGrid ────────────────────

interface MeasurementAreaGridProps {
  results: PointSunlightResult[]
  selectedPointId: string | null
  maxHours?: number
  cellSize?: number
}

export default function MeasurementAreaGrid({
  results,
  selectedPointId,
  maxHours = 8,
  cellSize = 1.5,
}: MeasurementAreaGridProps) {
  const cells = useMemo(() => {
    return results.map((r) => {
      const [tx, ty, tz] = backendToThree(r.x, r.y, r.z)
      return {
        id: r.id,
        position: [tx, ty + 0.03, tz] as [number, number, number],
        color: hoursToColor(r.total_hours, maxHours),
        isSelected: r.id === selectedPointId,
      }
    })
  }, [results, maxHours, selectedPointId])

  if (cells.length === 0) return null

  return (
    <group>
      {cells.map((cell) => (
        <mesh
          key={cell.id}
          rotation={[-Math.PI / 2, 0, 0]}
          position={cell.position}
        >
          <planeGeometry args={[cellSize, cellSize]} />
          <meshBasicMaterial
            color={cell.color}
            transparent
            opacity={cell.isSelected ? 0.6 : 0.35}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
