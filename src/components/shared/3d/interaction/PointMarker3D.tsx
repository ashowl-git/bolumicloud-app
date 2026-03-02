'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import type { BaseAnalysisPoint } from './types'
import { backendNormalToThree } from './types'

// ─── 마커 시각 유형 ─────────────────────────────

export type MarkerVisualType = 'sphere' | 'disc' | 'window'

// ─── PointMarker3D ─────────────────────────────
// 통합 3D 마커: sphere(지면점), disc(벽면 관찰점), window(사생활 창문)

interface PointMarker3DProps {
  point: BaseAnalysisPoint
  visualType?: MarkerVisualType
  isSelected?: boolean
  color?: string
  selectedColor?: string
  size?: number
  label?: string
  sublabel?: string
  onClick?: () => void
  // window 전용
  windowWidth?: number
  windowHeight?: number
}

export default function PointMarker3D({
  point,
  visualType = 'sphere',
  isSelected = false,
  color = '#ffffff',
  selectedColor = '#dc2626',
  size = 0.4,
  label,
  sublabel,
  onClick,
  windowWidth = 1.2,
  windowHeight = 1.5,
}: PointMarker3DProps) {
  const pos = point.threePosition

  // 법선 방향 쿼터니언 (disc, window용)
  const quaternion = useMemo(() => {
    if (!point.normal) return new THREE.Quaternion()
    const [nx, ny, nz] = backendNormalToThree(point.normal.dx, point.normal.dy, point.normal.dz)
    const normal = new THREE.Vector3(nx, ny, nz).normalize()
    const defaultNormal = new THREE.Vector3(0, 0, 1) // PlaneGeometry 기본 법선
    return new THREE.Quaternion().setFromUnitVectors(defaultNormal, normal)
  }, [point.normal])

  const displayColor = isSelected ? selectedColor : color

  return (
    <group position={pos}>
      {visualType === 'sphere' && (
        <SphereMarker
          radius={size}
          color={displayColor}
          isSelected={isSelected}
          selectedColor={selectedColor}
          onClick={onClick}
        />
      )}

      {visualType === 'disc' && (
        <DiscMarker
          quaternion={quaternion}
          radius={size}
          color={displayColor}
          isSelected={isSelected}
          selectedColor={selectedColor}
          normal={point.normal}
          onClick={onClick}
        />
      )}

      {visualType === 'window' && (
        <WindowMarker
          quaternion={quaternion}
          width={windowWidth}
          height={windowHeight}
          color={displayColor}
          isSelected={isSelected}
          selectedColor={selectedColor}
          onClick={onClick}
        />
      )}

      {/* 라벨 */}
      {(label || point.name) && (
        <Text
          position={[0, size + 0.5, 0]}
          fontSize={0.4}
          color="#374151"
          anchorX="center"
          anchorY="bottom"
        >
          {label || point.name}
        </Text>
      )}

      {/* 서브 라벨 (결과값 등) */}
      {sublabel && (
        <Text
          position={[0, -(size + 0.3), 0]}
          fontSize={0.3}
          color="#6b7280"
          anchorX="center"
          anchorY="top"
        >
          {sublabel}
        </Text>
      )}
    </group>
  )
}

// ─── Sphere (지면 측정점) ─────────────────────────

function SphereMarker({
  radius,
  color,
  isSelected,
  selectedColor,
  onClick,
}: {
  radius: number
  color: string
  isSelected: boolean
  selectedColor: string
  onClick?: () => void
}) {
  return (
    <group position={[0, radius, 0]}>
      <mesh onClick={(e) => { e.stopPropagation(); onClick?.() }}>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius + 0.05, 16, 16]} />
        <meshBasicMaterial color="#1e293b" wireframe />
      </mesh>
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius + 0.2, radius + 0.4, 32]} />
          <meshBasicMaterial color={selectedColor} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

// ─── Disc (벽면 관찰점) ─────────────────────────

function DiscMarker({
  quaternion,
  radius,
  color,
  isSelected,
  selectedColor,
  normal,
  onClick,
}: {
  quaternion: THREE.Quaternion
  radius: number
  color: string
  isSelected: boolean
  selectedColor: string
  normal?: { dx: number; dy: number; dz: number }
  onClick?: () => void
}) {
  // 법선 화살표 끝점 (Three.js 좌표)
  const arrowLength = radius * 3
  const arrowEnd = useMemo((): [number, number, number] => {
    if (!normal) return [0, 0, arrowLength]
    const [nx, ny, nz] = backendNormalToThree(normal.dx, normal.dy, normal.dz)
    return [nx * arrowLength, ny * arrowLength, nz * arrowLength]
  }, [normal, arrowLength])

  return (
    <group>
      {/* 디스크 */}
      <group quaternion={quaternion}>
        <mesh onClick={(e) => { e.stopPropagation(); onClick?.() }}>
          <circleGeometry args={[radius, 32]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        {/* 테두리 */}
        <mesh>
          <ringGeometry args={[radius - 0.05, radius, 32]} />
          <meshBasicMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 법선 화살표 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, ...arrowEnd]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ef4444" linewidth={2} />
      </line>

      {/* 선택 링 */}
      {isSelected && (
        <group quaternion={quaternion}>
          <mesh>
            <ringGeometry args={[radius + 0.15, radius + 0.3, 32]} />
            <meshBasicMaterial color={selectedColor} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  )
}

// ─── Window (사생활 창문) ─────────────────────────

function WindowMarker({
  quaternion,
  width,
  height,
  color,
  isSelected,
  selectedColor,
  onClick,
}: {
  quaternion: THREE.Quaternion
  width: number
  height: number
  color: string
  isSelected: boolean
  selectedColor: string
  onClick?: () => void
}) {
  return (
    <group quaternion={quaternion}>
      <mesh onClick={(e) => { e.stopPropagation(); onClick?.() }}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color={isSelected ? selectedColor : color}
          transparent
          opacity={isSelected ? 0.9 : 0.6}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
        <lineBasicMaterial color={isSelected ? selectedColor : color} />
      </lineSegments>
      {isSelected && (
        <mesh>
          <ringGeometry args={[
            Math.max(width, height) * 0.55,
            Math.max(width, height) * 0.65,
            32,
          ]} />
          <meshBasicMaterial color={selectedColor} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
