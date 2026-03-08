'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import type { ShadowFrame } from '@/lib/types/shadow'

// ─── 그림자 스타일 ─────────────────────────────

const SHADOW_COLOR = '#1a1a1a'
const SHADOW_OPACITY = 0.55

// ─── 좌표 변환: 백엔드(X=동, Y=북) -> Three.js Shape(x, y) ──

function coordsToShape(coordinates: [number, number][]): THREE.Shape | null {
  if (coordinates.length < 3) return null

  const shape = new THREE.Shape()
  const [x0, y0] = coordinates[0]
  shape.moveTo(x0, y0)

  for (let i = 1; i < coordinates.length; i++) {
    const [x, y] = coordinates[i]
    shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}

// ─── ShadowOverlay ─────────────────────────────

interface ShadowOverlayProps {
  frame: ShadowFrame | null
}

export default function ShadowOverlay({ frame }: ShadowOverlayProps) {
  const meshes = useMemo(() => {
    if (!frame || frame.polygons.length === 0) return []

    return frame.polygons
      .map((poly) => {
        const shape = coordsToShape(poly.coordinates)
        if (!shape) return null
        return { shape, buildingId: poly.building_id }
      })
      .filter((m): m is { shape: THREE.Shape; buildingId: string } => m !== null)
  }, [frame])

  if (meshes.length === 0) return null

  return (
    <group>
      {meshes.map((item, idx) => (
        <mesh
          key={`shadow-${item.buildingId}-${idx}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.05, 0]}
          renderOrder={10}
        >
          <shapeGeometry args={[item.shape]} />
          <meshBasicMaterial
            color={SHADOW_COLOR}
            transparent
            opacity={SHADOW_OPACITY}
            side={THREE.DoubleSide}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </mesh>
      ))}
    </group>
  )
}
