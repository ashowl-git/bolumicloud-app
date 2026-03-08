'use client'

import React, { useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { backendToThree } from '@/components/shared/3d/interaction/types'
import type { ShadowAccumulationCell } from '@/components/SunlightAnalysis/hooks/useShadowAnimation'

// shadow_hours 비율 → 투명(0) → 진한 남색(max)
function shadowToColor(hours: number, maxHours: number): THREE.Color {
  const t = Math.min(Math.max(hours / maxHours, 0), 1)
  // 투명 → 연한 파랑 → 진한 남색
  const r = Math.round(30 * t)
  const g = Math.round(40 * t)
  const b = Math.round(80 + 120 * t) // 80 → 200
  return new THREE.Color(r / 255, g / 255, b / 255)
}

interface ShadowAccumulationOverlayProps {
  cells: ShadowAccumulationCell[]
  cellSize: number
  maxShadowHours: number
}

function ShadowAccumulationOverlayInner({
  cells,
  cellSize,
  maxShadowHours,
}: ShadowAccumulationOverlayProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const { count, matrices, colors, opacities } = useMemo(() => {
    const count = cells.length
    const matrices = new Float32Array(count * 16)
    const colors = new Float32Array(count * 3)
    const opacities = new Float32Array(count)

    const mat4 = new THREE.Matrix4()
    const scale = new THREE.Vector3(cellSize * 0.95, cellSize * 0.95, 1)
    const rot = new THREE.Euler(-Math.PI / 2, 0, 0)
    const quat = new THREE.Quaternion().setFromEuler(rot)

    for (let i = 0; i < count; i++) {
      const cell = cells[i]
      const [tx, , tz] = backendToThree(cell.x, cell.y, 0)

      mat4.compose(
        new THREE.Vector3(tx, 0.02, tz),
        quat,
        scale,
      )
      mat4.toArray(matrices, i * 16)

      const t = maxShadowHours > 0 ? Math.min(cell.shadow_hours / maxShadowHours, 1) : 0
      const color = shadowToColor(cell.shadow_hours, maxShadowHours)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
      opacities[i] = 0.15 + t * 0.45 // 0.15 → 0.6
    }

    return { count, matrices, colors, opacities }
  }, [cells, cellSize, maxShadowHours])

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

  if (count === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
        depthWrite={false}
        vertexColors
      />
    </instancedMesh>
  )
}

const ShadowAccumulationOverlay = React.memo(ShadowAccumulationOverlayInner, (prev, next) => {
  return (
    prev.cells === next.cells &&
    prev.cellSize === next.cellSize &&
    prev.maxShadowHours === next.maxShadowHours
  )
})

export default ShadowAccumulationOverlay
