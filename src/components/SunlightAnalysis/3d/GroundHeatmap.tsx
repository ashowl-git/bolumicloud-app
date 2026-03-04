'use client'

import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import type { GridCell } from '@/lib/types/sunlight'
import { backendToThree } from '@/components/shared/3d/interaction/types'

// ─── 색상 보간: 일조시간 → 색상 (MeasurementAreaGrid와 동일) ──

function hoursToColor(hours: number, maxHours: number): THREE.Color {
  const t = Math.min(Math.max(hours / maxHours, 0), 1)

  let r: number, g: number, b: number
  if (t < 0.5) {
    r = 239
    g = Math.round(68 + t * 2 * (163 - 68))
    b = 68
  } else {
    r = Math.round(239 - (t - 0.5) * 2 * (239 - 34))
    g = Math.round(163 + (t - 0.5) * 2 * (197 - 163))
    b = Math.round(34 + (t - 0.5) * 2 * (94 - 34))
  }
  return new THREE.Color(r / 255, g / 255, b / 255)
}

// ─── GroundHeatmap ────────────────────

interface GroundHeatmapProps {
  gridData: GridCell[]
  gridSize: number
  maxHours?: number
  showTooltip?: boolean
}

function GroundHeatmapInner({
  gridData,
  gridSize,
  maxHours = 8,
  showTooltip = true,
}: GroundHeatmapProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null)
  const [tooltipPos, setTooltipPos] = useState<[number, number, number]>([0, 0, 0])

  // Create instanced geometry data
  const { count, matrices, colors } = useMemo(() => {
    const count = gridData.length
    const matrices = new Float32Array(count * 16)
    const colors = new Float32Array(count * 3)

    const mat4 = new THREE.Matrix4()
    const scale = new THREE.Vector3(gridSize * 0.95, gridSize * 0.95, 1)
    const rot = new THREE.Euler(-Math.PI / 2, 0, 0)
    const quat = new THREE.Quaternion().setFromEuler(rot)

    for (let i = 0; i < count; i++) {
      const cell = gridData[i]
      const [tx, , tz] = backendToThree(cell.x, cell.y, 0)

      mat4.compose(
        new THREE.Vector3(tx, 0.025, tz),
        quat,
        scale,
      )
      mat4.toArray(matrices, i * 16)

      const color = hoursToColor(cell.total_hours, maxHours)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    return { count, matrices, colors }
  }, [gridData, gridSize, maxHours])

  // Apply instance matrices and colors
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh || count === 0) return

    const mat4 = new THREE.Matrix4()
    const color = new THREE.Color()

    for (let i = 0; i < count; i++) {
      mat4.fromArray(matrices, i * 16)
      mesh.setMatrixAt(i, mat4)

      color.setRGB(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2])
      mesh.setColorAt(i, color)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [count, matrices, colors])

  // Hover handler
  const handlePointerMove = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      if (!showTooltip) return
      e.stopPropagation?.()
      const idx = e.instanceId as number | undefined
      if (idx != null && idx < gridData.length) {
        const cell = gridData[idx]
        const [tx, , tz] = backendToThree(cell.x, cell.y, 0)
        setHoveredCell(cell)
        setTooltipPos([tx, 0.5, tz])
      }
    },
    [gridData, showTooltip],
  )

  const handlePointerOut = useCallback(() => {
    setHoveredCell(null)
  }, [])

  if (count === 0) return null

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
          vertexColors
        />
      </instancedMesh>

      {/* Tooltip */}
      {showTooltip && hoveredCell && (
        <Html position={tooltipPos} center style={{ pointerEvents: 'none' }}>
          <div className="bg-gray-900/90 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            <div>
              총일조: <span className="font-semibold">{hoveredCell.total_hours.toFixed(1)}h</span>
            </div>
            <div>
              연속: <span className="font-semibold">{hoveredCell.continuous_hours.toFixed(1)}h</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

const GroundHeatmap = React.memo(GroundHeatmapInner, (prev, next) => {
  return (
    prev.gridData === next.gridData &&
    prev.gridSize === next.gridSize &&
    prev.maxHours === next.maxHours
  )
})

export default GroundHeatmap
