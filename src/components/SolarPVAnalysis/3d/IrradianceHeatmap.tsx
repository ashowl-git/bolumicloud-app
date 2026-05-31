'use client'

import { useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { SurfacePVResult } from '@/lib/types/solar-pv'
import { backendToThree, backendNormalToThree } from '@/components/shared/3d/interaction/types'

// ─── IrradianceHeatmap ─────────────────────────
// 발전량 분석 결과를 surface_score 기반 색상으로 패널 표면에 오버레이.
// 색상 스케일: red(낮음) -> yellow(중간) -> green(높음)

interface IrradianceHeatmapProps {
  surfaces: SurfacePVResult[]
  selectedSurfaceId: string | null
  onSurfaceClick?: (surfaceId: string) => void
  /** 백엔드 좌표 center 정보가 별도로 필요할 경우 주입 */
  surfaceCenters?: Record<string, [number, number, number]>
  surfaceNormals?: Record<string, [number, number, number]>
  surfaceAreas?: Record<string, number>
}

// ─── surface_score(0-100) -> 색상 보간 ──────────

function scoreToColor(score: number): string {
  const t = Math.min(Math.max(score / 100, 0), 1)
  const clamp = (v: number) => Math.round(Math.max(0, Math.min(255, v)))

  // red(0) -> yellow(50) -> green(100)
  if (t < 0.5) {
    const r = 239
    const g = clamp(68 + t * 2 * (234 - 68))
    const b = 68
    return `rgb(${r},${g},${b})`
  }
  const r = clamp(239 - (t - 0.5) * 2 * (239 - 34))
  const g = clamp(234 - (t - 0.5) * 2 * (234 - 197))
  const b = clamp(8 + (t - 0.5) * 2 * (94 - 8))
  return `rgb(${r},${g},${b})`
}

// ─── 법선 벡터로 회전 쿼터니언 계산 ──────────────

function normalToQuaternion(normal: [number, number, number]): THREE.Quaternion {
  const n = new THREE.Vector3(...normal).normalize()
  const up = new THREE.Vector3(0, 0, 1)
  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(up, n)
  return quaternion
}

// ─── 숫자 포맷 유틸리티 ─────────────────────────

function formatKwh(kwh: number): string {
  if (kwh >= 1000) return `${(kwh / 1000).toFixed(1)} MWh`
  return `${kwh.toFixed(0)} kWh`
}

export default function IrradianceHeatmap({
  surfaces,
  selectedSurfaceId,
  onSurfaceClick,
  surfaceCenters = {},
  surfaceNormals = {},
  surfaceAreas = {},
}: IrradianceHeatmapProps) {
  const cells = useMemo(() => {
    return surfaces
      .filter((s) => surfaceCenters[s.surface_id] && surfaceNormals[s.surface_id])
      .map((s) => {
        const center = surfaceCenters[s.surface_id]
        const normal = surfaceNormals[s.surface_id]
        const area = surfaceAreas[s.surface_id] ?? s.area_m2

        const [tx, ty, tz] = backendToThree(center[0], center[1], center[2])
        const threeNormal = backendNormalToThree(normal[0], normal[1], normal[2])
        const quaternion = normalToQuaternion(threeNormal)
        const euler = new THREE.Euler().setFromQuaternion(quaternion)

        const side = Math.sqrt(area)

        return {
          surfaceId: s.surface_id,
          position: [tx, ty, tz] as [number, number, number],
          // label은 표면 법선 방향으로 약간 오프셋
          labelPosition: [
            tx + threeNormal[0] * 0.3,
            ty + threeNormal[1] * 0.3 + 0.5,
            tz + threeNormal[2] * 0.3,
          ] as [number, number, number],
          rotation: [euler.x, euler.y, euler.z] as [number, number, number],
          size: side,
          color: scoreToColor(s.surface_score),
          isSelected: s.surface_id === selectedSurfaceId,
          capacityKwp: s.capacity_kwp,
          annualAcKwh: s.annual_ac_kwh,
          score: s.surface_score,
        }
      })
  }, [surfaces, selectedSurfaceId, surfaceCenters, surfaceNormals, surfaceAreas])

  const handleClick = useCallback(
    (surfaceId: string) => (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      onSurfaceClick?.(surfaceId)
    },
    [onSurfaceClick],
  )

  if (cells.length === 0) return null

  return (
    <group>
      {cells.map((cell) => (
        <group key={cell.surfaceId}>
          {/* 색상 오버레이 평면 */}
          <mesh
            position={cell.position}
            rotation={cell.rotation}
            onClick={handleClick(cell.surfaceId)}
          >
            <planeGeometry args={[cell.size, cell.size]} />
            <meshBasicMaterial
              color={cell.color}
              transparent
              opacity={cell.isSelected ? 0.6 : 0.35}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* 선택된 표면: capacity / annual 라벨 표시 */}
          {cell.isSelected && (
            <Html
              position={cell.labelPosition}
              center
              distanceFactor={15}
              style={{ pointerEvents: 'none' }}
            >
              <div className="bg-white/90 border border-gray-300 rounded px-2 py-1 text-xs whitespace-nowrap shadow-sm">
                <p className="font-medium text-gray-700">
                  {cell.capacityKwp.toFixed(1)} kWp
                </p>
                <p className="text-gray-500">
                  {formatKwh(cell.annualAcKwh)}/yr
                </p>
                <p className="text-gray-400">
                  Score: {cell.score.toFixed(0)}
                </p>
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  )
}
