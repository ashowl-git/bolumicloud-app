'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import type { SurfaceHit } from './types'
import { threeToBackend, threeNormalToBackend } from './types'

// ─── SurfaceHighlight ─────────────────────────────
// 호버 피드백: 교차점에 반투명 디스크 + 법선 화살표 + 좌표 툴팁

interface SurfaceHighlightProps {
  hit: SurfaceHit | null
  showTooltip?: boolean
  color?: string
  radius?: number
}

export default function SurfaceHighlight({
  hit,
  showTooltip = true,
  color = '#fbbf24',
  radius = 0.5,
}: SurfaceHighlightProps) {
  // 법선 방향으로 디스크를 정렬하는 쿼터니언
  const quaternion = useMemo(() => {
    if (!hit) return new THREE.Quaternion()
    const normal = new THREE.Vector3(...hit.normal).normalize()
    const defaultNormal = new THREE.Vector3(0, 1, 0) // 디스크 기본 방향 (Y-up)
    return new THREE.Quaternion().setFromUnitVectors(defaultNormal, normal)
  }, [hit])

  // 법선 화살표 끝점
  const arrowEnd = useMemo(() => {
    if (!hit) return [0, 0, 0] as [number, number, number]
    const len = radius * 3
    return [
      hit.point[0] + hit.normal[0] * len,
      hit.point[1] + hit.normal[1] * len,
      hit.point[2] + hit.normal[2] * len,
    ] as [number, number, number]
  }, [hit, radius])

  if (!hit) return null

  const backend = threeToBackend(hit.point[0], hit.point[1], hit.point[2])
  const backendNormal = threeNormalToBackend(hit.normal[0], hit.normal[1], hit.normal[2])

  return (
    <group>
      {/* 반투명 디스크 (법선 방향 정렬) */}
      <mesh
        position={hit.point}
        quaternion={quaternion}
      >
        <circleGeometry args={[radius, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 디스크 테두리 */}
      <mesh
        position={hit.point}
        quaternion={quaternion}
      >
        <ringGeometry args={[radius - 0.02, radius, 32]} />
        <meshBasicMaterial
          color={color}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 법선 화살표 (교차점 -> 법선 방향) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([...hit.point, ...arrowEnd]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>

      {/* 화살표 머리 (작은 콘) */}
      <mesh position={arrowEnd} quaternion={quaternion}>
        <coneGeometry args={[0.15, 0.4, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* 좌표 툴팁 */}
      {showTooltip && (
        <Html
          position={[
            hit.point[0],
            hit.point[1] + radius * 4,
            hit.point[2],
          ]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-white/95 border border-gray-200 shadow-lg px-2 py-1 text-xs whitespace-nowrap">
            <div className="text-gray-700 font-mono">
              ({backend.x.toFixed(1)}, {backend.y.toFixed(1)}, {backend.z.toFixed(1)})
            </div>
            <div className="text-gray-400 text-[10px]">
              n: ({backendNormal.dx.toFixed(2)}, {backendNormal.dy.toFixed(2)}, {backendNormal.dz.toFixed(2)})
              | {hit.surfaceType}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
