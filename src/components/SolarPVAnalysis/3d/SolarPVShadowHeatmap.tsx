'use client'

import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { backendToThree } from '@/components/shared/3d/interaction/types'

// ─── 색상 보간: 그림자 시간 → 색상 (green→yellow→orange→red) ──

function shadowHoursToColor(hours: number, maxHours: number): THREE.Color {
  const t = Math.min(Math.max(hours / maxHours, 0), 1)

  let r: number, g: number, b: number
  if (t < 0.33) {
    // green → yellow
    const s = t / 0.33
    r = Math.round(34 + s * (234 - 34))
    g = Math.round(197 + s * (179 - 197))
    b = Math.round(94 - s * 94)
  } else if (t < 0.66) {
    // yellow → orange
    const s = (t - 0.33) / 0.33
    r = Math.round(234 + s * (249 - 234))
    g = Math.round(179 - s * (179 - 115))
    b = Math.round(0 + s * 22)
  } else {
    // orange → red
    const s = (t - 0.66) / 0.34
    r = Math.round(249 - s * (249 - 220))
    g = Math.round(115 - s * (115 - 38))
    b = Math.round(22 + s * (38 - 22))
  }
  return new THREE.Color(r / 255, g / 255, b / 255)
}

// ─── SolarPVShadowHeatmap ────────────────────

export interface ShadowAccumulationCell {
  x: number
  y: number
  shadow_hours: number
  shadow_ratio?: number
}

interface SolarPVShadowHeatmapProps {
  cells: ShadowAccumulationCell[]
  cellSize: number
  maxShadowHours: number
  mode?: 'hours' | 'ratio'
}

function SolarPVShadowHeatmapInner({
  cells,
  cellSize,
  maxShadowHours,
  mode = 'hours',
}: SolarPVShadowHeatmapProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const [hoveredCell, setHoveredCell] = useState<ShadowAccumulationCell | null>(null)
  const [tooltipPos, setTooltipPos] = useState<[number, number, number]>([0, 0, 0])

  const { count, matrices, colors } = useMemo(() => {
    const count = cells.length
    const matrices = new Float32Array(count * 16)
    const colors = new Float32Array(count * 3)

    const mat4 = new THREE.Matrix4()
    const scale = new THREE.Vector3(cellSize * 0.95, cellSize * 0.95, 1)
    const rot = new THREE.Euler(-Math.PI / 2, 0, 0)
    const quat = new THREE.Quaternion().setFromEuler(rot)

    const effectiveMax = maxShadowHours > 0 ? maxShadowHours : 8

    for (let i = 0; i < count; i++) {
      const cell = cells[i]
      const [tx, , tz] = backendToThree(cell.x, cell.y, 0)

      mat4.compose(
        new THREE.Vector3(tx, 0.03, tz),
        quat,
        scale,
      )
      mat4.toArray(matrices, i * 16)

      const colorValue = mode === 'ratio'
        ? (cell.shadow_ratio ?? 0) * effectiveMax
        : cell.shadow_hours
      const color = shadowHoursToColor(colorValue, effectiveMax)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    return { count, matrices, colors }
  }, [cells, cellSize, maxShadowHours, mode])

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

  const handlePointerMove = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (e: any) => {
      e.stopPropagation?.()
      const idx = e.instanceId as number | undefined
      if (idx != null && idx < cells.length) {
        const cell = cells[idx]
        const [tx, , tz] = backendToThree(cell.x, cell.y, 0)
        setHoveredCell(cell)
        setTooltipPos([tx, 0.5, tz])
      }
    },
    [cells],
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
          opacity={0.45}
          side={THREE.DoubleSide}
          depthWrite={false}
          vertexColors
        />
      </instancedMesh>

      {hoveredCell && (
        <Html position={tooltipPos} center style={{ pointerEvents: 'none' }}>
          <div className="bg-gray-900/90 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {mode === 'ratio' ? (
              <>그림자 빈도: <span className="font-semibold">{((hoveredCell.shadow_ratio ?? 0) * 100).toFixed(0)}%</span></>
            ) : (
              <>그림자: <span className="font-semibold">{hoveredCell.shadow_hours.toFixed(1)}h</span></>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

const SolarPVShadowHeatmap = React.memo(SolarPVShadowHeatmapInner, (prev, next) => {
  return (
    prev.cells === next.cells &&
    prev.cellSize === next.cellSize &&
    prev.maxShadowHours === next.maxShadowHours &&
    prev.mode === next.mode
  )
})

export default SolarPVShadowHeatmap
