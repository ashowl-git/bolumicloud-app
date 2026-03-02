'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import type { WindowSpec } from '@/lib/types/privacy'

// ─── 색상 ───────────────────────────────────────
const OBSERVER_COLOR = '#2563eb'  // blue
const TARGET_COLOR = '#ea580c'    // orange
const SELECTED_COLOR = '#fbbf24'  // amber highlight

// ─── 좌표 변환: 백엔드(X=동, Y=북, Z=위) → Three.js(X=동, Y=위, Z=북) ──
function backendToThree(x: number, y: number, z: number): [number, number, number] {
  return [x, z, y]
}

// ─── normal → Three.js 방향 쿼터니언 변환 ────────
function normalToQuaternion(dx: number, dy: number, dz: number): THREE.Quaternion {
  // 백엔드 normal (dx, dy, dz) → Three.js normal (dx, dz, dy)
  const normal = new THREE.Vector3(dx, dz, dy).normalize()
  // PlaneGeometry 기본 normal은 (0, 0, 1)
  const defaultNormal = new THREE.Vector3(0, 0, 1)
  const q = new THREE.Quaternion().setFromUnitVectors(defaultNormal, normal)
  return q
}

// ─── WindowMarkers ────────────────────────────

interface WindowMarkersProps {
  observerWindows: WindowSpec[]
  targetWindows: WindowSpec[]
  selectedWindowId: string | null
  onWindowClick: (id: string) => void
}

export default function WindowMarkers({
  observerWindows,
  targetWindows,
  selectedWindowId,
  onWindowClick,
}: WindowMarkersProps) {
  const observerMarkers = useMemo(
    () => observerWindows.map((w) => buildMarkerData(w)),
    [observerWindows],
  )

  const targetMarkers = useMemo(
    () => targetWindows.map((w) => buildMarkerData(w)),
    [targetWindows],
  )

  return (
    <group>
      {observerMarkers.map((m) => (
        <WindowMarker
          key={`obs-${m.id}`}
          markerData={m}
          color={OBSERVER_COLOR}
          isSelected={m.id === selectedWindowId}
          onClick={() => onWindowClick(m.id)}
        />
      ))}
      {targetMarkers.map((m) => (
        <WindowMarker
          key={`tgt-${m.id}`}
          markerData={m}
          color={TARGET_COLOR}
          isSelected={m.id === selectedWindowId}
          onClick={() => onWindowClick(m.id)}
        />
      ))}
    </group>
  )
}

// ─── 마커 데이터 빌더 ───────────────────────────

interface MarkerData {
  id: string
  position: [number, number, number]
  quaternion: THREE.Quaternion
  width: number
  height: number
}

function buildMarkerData(w: WindowSpec): MarkerData {
  const position = backendToThree(w.x, w.y, w.z)
  const quaternion = normalToQuaternion(w.normal_dx, w.normal_dy, w.normal_dz)

  return {
    id: w.id,
    position,
    quaternion,
    width: Math.max(w.width, 0.5),
    height: Math.max(w.height, 0.5),
  }
}

// ─── 개별 창문 마커 ──────────────────────────────

interface WindowMarkerProps {
  markerData: MarkerData
  color: string
  isSelected: boolean
  onClick: () => void
}

function WindowMarker({ markerData, color, isSelected, onClick }: WindowMarkerProps) {
  const { position, quaternion, width, height } = markerData

  return (
    <group position={position} quaternion={quaternion}>
      {/* 창문 면 */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick() }}
        onPointerOver={(e) => { e.stopPropagation() }}
      >
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color={isSelected ? SELECTED_COLOR : color}
          transparent
          opacity={isSelected ? 0.9 : 0.6}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 테두리 와이어프레임 */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
        <lineBasicMaterial color={isSelected ? SELECTED_COLOR : color} />
      </lineSegments>

      {/* 선택 표시 링 */}
      {isSelected && (
        <mesh>
          <ringGeometry
            args={[
              Math.max(width, height) * 0.55,
              Math.max(width, height) * 0.65,
              32,
            ]}
          />
          <meshBasicMaterial color={SELECTED_COLOR} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
