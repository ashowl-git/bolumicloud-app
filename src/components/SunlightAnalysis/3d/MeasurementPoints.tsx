'use client'

import { useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import type { MeasurementPoint, PointSunlightResult } from '@/lib/types/sunlight'
import type { PlacementMode } from '../hooks/useMeasurementPlacement'
import { backendToThree } from '@/components/shared/3d/interaction/types'

// ─── MeasurementPoints ──────────────────────

interface MeasurementPointsProps {
  points: MeasurementPoint[]
  results?: PointSunlightResult[]
  selectedPointId: string | null
  mode: PlacementMode
  onPointClick: (id: string) => void
  onGroundClick?: (x: number, y: number, z: number) => void
}

const RADIUS = 0.4

export default function MeasurementPoints({
  points,
  results,
  selectedPointId,
  mode,
  onPointClick,
  onGroundClick,
}: MeasurementPointsProps) {
  const resultMap = useMemo(() => {
    if (!results) return new Map<string, PointSunlightResult>()
    return new Map(results.map((r) => [r.id, r]))
  }, [results])

  const handleGroundClick = useCallback(
    (e: { stopPropagation: () => void; point: THREE.Vector3 }) => {
      if (mode !== 'add' || !onGroundClick) return
      e.stopPropagation()
      onGroundClick(e.point.x, e.point.y, e.point.z)
    },
    [mode, onGroundClick],
  )

  return (
    <group>
      {/* 지면 클릭 감지 평면 (add 모드 전용) */}
      {onGroundClick && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.01, 0]}
          onClick={handleGroundClick}
          visible={false}
        >
          <planeGeometry args={[500, 500]} />
          <meshBasicMaterial side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 측정점 마커 */}
      {points.map((point) => {
        const [tx, ty, tz] = backendToThree(point.x, point.y, point.z)
        const result = resultMap.get(point.id)
        const isSelected = selectedPointId === point.id

        const color = result
          ? result.compliant ? '#22c55e' : '#ef4444'
          : '#ffffff'

        return (
          <group key={point.id} position={[tx, ty + RADIUS, tz]}>
            {/* 마커 구체 */}
            <mesh onClick={(e) => { e.stopPropagation(); onPointClick(point.id) }}>
              <sphereGeometry args={[RADIUS, 16, 16]} />
              <meshStandardMaterial color={color} roughness={0.4} />
            </mesh>

            {/* 와이어프레임 테두리 */}
            <mesh>
              <sphereGeometry args={[RADIUS + 0.05, 16, 16]} />
              <meshBasicMaterial color="#1e293b" wireframe />
            </mesh>

            {/* 선택 링 */}
            {isSelected && (
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[RADIUS + 0.2, RADIUS + 0.4, 32]} />
                <meshBasicMaterial color="#dc2626" side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* 라벨 */}
            <Text
              position={[0, RADIUS + 0.5, 0]}
              fontSize={0.4}
              color="#374151"
              anchorX="center"
              anchorY="bottom"
            >
              {point.name}
            </Text>

            {/* 결과 시간 표시 */}
            {result && (
              <Text
                position={[0, -(RADIUS + 0.3), 0]}
                fontSize={0.3}
                color={result.compliant ? '#16a34a' : '#dc2626'}
                anchorX="center"
                anchorY="top"
              >
                {result.total_hours.toFixed(1)}h
              </Text>
            )}
          </group>
        )
      })}
    </group>
  )
}
