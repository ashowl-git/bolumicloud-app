'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import type { AreaDefinition } from './useAreaPlacement'

// ─── AreaGridPreview ─────────────────────────────
// 영역 사각형 프리뷰 + 확정 후 격자점 프리뷰

interface AreaGridPreviewProps {
  // 배치 중: 첫 코너 + 마우스 위치
  firstCorner: [number, number, number] | null
  previewCorner: [number, number, number] | null
  // 확정 후: 격자 시각화
  area: AreaDefinition | null
  gridSpacing: number
  gridPointCount: number
}

export default function AreaGridPreview({
  firstCorner,
  previewCorner,
  area,
  gridSpacing,
  gridPointCount,
}: AreaGridPreviewProps) {
  // 배치 중인 사각형
  const activeRect = useMemo(() => {
    if (area) return area
    if (firstCorner && previewCorner) {
      return { corner1: firstCorner, corner2: previewCorner }
    }
    return null
  }, [area, firstCorner, previewCorner])

  // 격자선 (확정 후만)
  const gridLines = useMemo(() => {
    if (!area) return null
    const { corner1, corner2 } = area
    const minX = Math.min(corner1[0], corner2[0])
    const maxX = Math.max(corner1[0], corner2[0])
    const minZ = Math.min(corner1[2], corner2[2])
    const maxZ = Math.max(corner1[2], corner2[2])
    const y = Math.max(corner1[1], corner2[1]) + 0.05

    const points: THREE.Vector3[] = []
    const spacing = Math.max(0.5, gridSpacing)

    // X방향 선
    for (let z = minZ; z <= maxZ; z += spacing) {
      points.push(new THREE.Vector3(minX, y, z))
      points.push(new THREE.Vector3(maxX, y, z))
    }
    // Z방향 선
    for (let x = minX; x <= maxX; x += spacing) {
      points.push(new THREE.Vector3(x, y, minZ))
      points.push(new THREE.Vector3(x, y, maxZ))
    }

    return points
  }, [area, gridSpacing])

  if (!activeRect && !firstCorner) return null

  return (
    <group>
      {/* 첫 코너 마커 */}
      {firstCorner && !area && (
        <mesh position={firstCorner}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      )}

      {/* 사각형 프리뷰 */}
      {activeRect && (
        <RectOutline
          corner1={activeRect.corner1}
          corner2={activeRect.corner2}
          isConfirmed={!!area}
        />
      )}

      {/* 격자선 (확정 후) */}
      {gridLines && gridLines.length >= 2 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(gridLines.flatMap((v) => [v.x, v.y, v.z])), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#94a3b8" transparent opacity={0.5} />
        </lineSegments>
      )}

      {/* 격자점 수 라벨 */}
      {area && gridPointCount > 0 && (
        <Html
          position={[
            (area.corner1[0] + area.corner2[0]) / 2,
            Math.max(area.corner1[1], area.corner2[1]) + 1,
            (area.corner1[2] + area.corner2[2]) / 2,
          ]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-white/90 border border-gray-200 px-2 py-1 text-xs text-gray-700 whitespace-nowrap">
            {gridPointCount}개 격자점 | {gridSpacing}m 간격
          </div>
        </Html>
      )}
    </group>
  )
}

// ─── 사각형 외곽선 ─────────────────────────────

function RectOutline({
  corner1,
  corner2,
  isConfirmed,
}: {
  corner1: [number, number, number]
  corner2: [number, number, number]
  isConfirmed: boolean
}) {
  const y = Math.max(corner1[1], corner2[1]) + 0.03

  const vertices = useMemo(() => {
    return new Float32Array([
      corner1[0], y, corner1[2],
      corner2[0], y, corner1[2],
      corner2[0], y, corner2[2],
      corner1[0], y, corner2[2],
      corner1[0], y, corner1[2], // 닫기
    ])
  }, [corner1, corner2, y])

  return (
    <group>
      {/* 외곽선 */}
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[vertices, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color={isConfirmed ? '#22c55e' : '#ef4444'}
          linewidth={2}
        />
      </line>

      {/* 반투명 면 */}
      <mesh position={[
        (corner1[0] + corner2[0]) / 2,
        y,
        (corner1[2] + corner2[2]) / 2,
      ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[
          Math.abs(corner2[0] - corner1[0]),
          Math.abs(corner2[2] - corner1[2]),
        ]} />
        <meshBasicMaterial
          color={isConfirmed ? '#22c55e' : '#ef4444'}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
