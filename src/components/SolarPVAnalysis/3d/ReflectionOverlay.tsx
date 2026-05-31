'use client'

import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { backendToThree } from '@/components/shared/3d/interaction/types'

// ─── 반사 강도 → 색상 (노랑 → 주황 → 빨강) ──

function intensityToColor(intensity: number, maxIntensity: number): THREE.Color {
  const t = Math.min(Math.max(intensity / maxIntensity, 0), 1)
  const r = Math.round(255)
  const g = Math.round(220 - t * 180)
  const b = Math.round(50 - t * 50)
  return new THREE.Color(r / 255, g / 255, b / 255)
}

// ─── Types ──

export interface ReflectionPoint {
  x: number
  y: number
  intensity: number
  surface_id: string
}

export interface ReflectionFrame {
  minute: number
  time: string
  solar_altitude: number
  solar_azimuth: number
  reflection_points: ReflectionPoint[]
}

interface ReflectionOverlayProps {
  frame: ReflectionFrame | null
  maxIntensity?: number
}

// ─── ReflectionOverlay (per-frame reflection points) ──

function ReflectionOverlayInner({ frame, maxIntensity = 0.11 }: ReflectionOverlayProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const [hoveredPoint, setHoveredPoint] = useState<ReflectionPoint | null>(null)
  const [tooltipPos, setTooltipPos] = useState<[number, number, number]>([0, 0, 0])

  const points = frame?.reflection_points ?? []

  const { count, matrices, colors } = useMemo(() => {
    const count = points.length
    const matrices = new Float32Array(count * 16)
    const colors = new Float32Array(count * 3)

    const mat4 = new THREE.Matrix4()
    const discRadius = 1.5
    const scale = new THREE.Vector3(discRadius, discRadius, 1)
    const rot = new THREE.Euler(-Math.PI / 2, 0, 0)
    const quat = new THREE.Quaternion().setFromEuler(rot)

    for (let i = 0; i < count; i++) {
      const pt = points[i]
      const [tx, , tz] = backendToThree(pt.x, pt.y, 0)

      mat4.compose(
        new THREE.Vector3(tx, 0.06, tz),
        quat,
        scale,
      )
      mat4.toArray(matrices, i * 16)

      const color = intensityToColor(pt.intensity, maxIntensity)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    return { count, matrices, colors }
  }, [points, maxIntensity])

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
      if (idx != null && idx < points.length) {
        const pt = points[idx]
        const [tx, , tz] = backendToThree(pt.x, pt.y, 0)
        setHoveredPoint(pt)
        setTooltipPos([tx, 0.8, tz])
      }
    },
    [points],
  )

  const handlePointerOut = useCallback(() => {
    setHoveredPoint(null)
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
        <circleGeometry args={[1, 16]} />
        <meshBasicMaterial
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          depthWrite={false}
          vertexColors
        />
      </instancedMesh>

      {hoveredPoint && (
        <Html position={tooltipPos} center style={{ pointerEvents: 'none' }}>
          <div className="bg-gray-900/90 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            <div>
              반사 강도: <span className="font-semibold text-amber-300">{(hoveredPoint.intensity * 100).toFixed(1)}%</span>
            </div>
            <div className="text-gray-400">{hoveredPoint.surface_id}</div>
          </div>
        </Html>
      )}
    </group>
  )
}

const ReflectionOverlay = React.memo(ReflectionOverlayInner, (prev, next) => {
  return prev.frame === next.frame && prev.maxIntensity === next.maxIntensity
})

export default ReflectionOverlay
