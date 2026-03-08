'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { BoundingBox } from './types'

interface CompassRoseProps {
  bbox?: BoundingBox | null
  offset?: number
}

// 좌표계: +X=East, +Z=South (카메라 프리셋 south=[0,0.3,+1] 기준)
const DIRECTIONS = [
  { label: 'N', angle: Math.PI, color: '#dc2626' },
  { label: 'E', angle: Math.PI / 2, color: '#64748b' },
  { label: 'S', angle: 0, color: '#64748b' },
  { label: 'W', angle: -Math.PI / 2, color: '#64748b' },
] as const

export default function CompassRose({ bbox, offset = 5 }: CompassRoseProps) {
  const radius = useMemo(() => {
    if (!bbox) return 30
    const maxSpan = Math.max(bbox.size[0], bbox.size[2])
    return maxSpan * 0.8 + offset
  }, [bbox, offset])

  return (
    <group>
      {DIRECTIONS.map(({ label, angle, color }) => {
        // +Z = North (Three.js 기본 좌표계)
        const x = Math.sin(angle) * radius
        const z = Math.cos(angle) * radius

        return (
          <Text
            key={label}
            position={[x, 0.5, z]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={3}
            color={color}
            anchorX="center"
            anchorY="middle"
            characters="NESW"
          >
            {label}
          </Text>
        )
      })}
      {/* 북쪽 방향 화살표 선 (-Z = North) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0.1, 0, 0, 0.1, -(radius - 4)])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#dc2626" linewidth={2} />
      </line>
    </group>
  )
}
