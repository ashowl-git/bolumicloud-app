'use client'

import React, { useMemo } from 'react'
import * as THREE from 'three'
import { Text, Line } from '@react-three/drei'
import { backendToThree } from '@/components/shared/3d/interaction/types'
import type { SolarChart3DData } from '@/hooks/useSolarChart3D'

// 색상 상수
const COLOR_SUNLIT = new THREE.Color(0.95, 0.85, 0.2)   // 밝은 노란색
const COLOR_BLOCKED = new THREE.Color(0.35, 0.35, 0.4)   // 어두운 회색

interface SolarChart3DOverlayProps {
  data: SolarChart3DData
}

function SolarChart3DOverlayInner({ data }: SolarChart3DOverlayProps) {
  const { point, rays } = data

  // 측정점 Three.js 좌표
  const originPos = useMemo(
    () => backendToThree(point[0], point[1], point[2]),
    [point],
  )

  // Fan surface geometry (연속 레이 쌍마다 삼각형)
  const fanGeometry = useMemo(() => {
    if (rays.length < 2) return null

    const positions: number[] = []
    const colors: number[] = []

    for (let i = 0; i < rays.length - 1; i++) {
      const r0 = rays[i]
      const r1 = rays[i + 1]

      const ep0 = backendToThree(r0.endpoint[0], r0.endpoint[1], r0.endpoint[2])
      const ep1 = backendToThree(r1.endpoint[0], r1.endpoint[1], r1.endpoint[2])

      // 삼각형: origin -> ep0 -> ep1
      positions.push(originPos[0], originPos[1], originPos[2])
      positions.push(ep0[0], ep0[1], ep0[2])
      positions.push(ep1[0], ep1[1], ep1[2])

      // 색상: 두 레이 중 하나라도 blocked이면 회색
      const color = (r0.blocked || r1.blocked) ? COLOR_BLOCKED : COLOR_SUNLIT
      for (let v = 0; v < 3; v++) {
        colors.push(color.r, color.g, color.b)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }, [rays, originPos])

  // 정시 라벨 위치 (HH:00)
  const hourLabels = useMemo(() => {
    return rays.filter((r) => r.time.endsWith(':00')).map((r) => ({
      time: r.time,
      position: backendToThree(r.endpoint[0], r.endpoint[1], r.endpoint[2]) as [number, number, number],
    }))
  }, [rays])

  // 일조/차폐 구간 경계선 포인트
  const rangeLinePoints = useMemo(() => {
    if (rays.length === 0) return { total: [] as [number, number, number][], continuous: [] as [number, number, number][] }

    const totalPts: [number, number, number][] = rays.map((r) =>
      backendToThree(r.endpoint[0], r.endpoint[1], r.endpoint[2]),
    )

    // 연속일조 구간 (09:00~15:00 범위 내)
    const continuousRays = rays.filter((r) => {
      const h = parseInt(r.time.split(':')[0])
      return h >= 9 && h < 15
    })
    const continuousPts: [number, number, number][] = continuousRays.map((r) =>
      backendToThree(r.endpoint[0], r.endpoint[1], r.endpoint[2]),
    )

    return { total: totalPts, continuous: continuousPts }
  }, [rays])

  if (!fanGeometry) return null

  return (
    <group>
      {/* Fan Surface */}
      <mesh geometry={fanGeometry}>
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 총일조 범위 외곽선 (빨간색) */}
      {rangeLinePoints.total.length >= 2 && (
        <Line
          points={[originPos as [number, number, number], ...rangeLinePoints.total, originPos as [number, number, number]]}
          color="#ef4444"
          lineWidth={2}
        />
      )}

      {/* 연속일조 범위 (초록색) */}
      {rangeLinePoints.continuous.length >= 2 && (
        <Line
          points={[originPos as [number, number, number], ...rangeLinePoints.continuous, originPos as [number, number, number]]}
          color="#22c55e"
          lineWidth={2}
        />
      )}

      {/* 정시 라벨 */}
      {hourLabels.map((label) => (
        <Text
          key={label.time}
          position={label.position}
          fontSize={1.5}
          color="#1e293b"
          anchorX="center"
          anchorY="bottom"
          fontWeight="bold"
        >
          {label.time}
        </Text>
      ))}

      {/* 측정점 마커 */}
      <mesh position={originPos}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
    </group>
  )
}

const SolarChart3DOverlay = React.memo(SolarChart3DOverlayInner)
export default SolarChart3DOverlay
