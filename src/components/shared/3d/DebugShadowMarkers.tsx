'use client'

import * as THREE from 'three'
import type { ShadowFrame } from '@/lib/types/shadow'

interface DebugShadowMarkersProps {
  frame: ShadowFrame | null
  modelScene: THREE.Group | null
  visible?: boolean
}

/**
 * 개발용 좌표계 검증 마커.
 *
 * 그림자 폴리곤 꼭짓점(빨간 구)과 건물 모서리(파란 구)를 표시하여
 * 백엔드-프론트엔드 좌표 변환 정합성을 시각적으로 확인한다.
 *
 * 사용: SolarPVWorkspace에서 조건부 렌더링 (개발 시에만 활성화)
 * <DebugShadowMarkers frame={shadow.currentFrame} modelScene={modelScene} visible={debugMode} />
 */
export default function DebugShadowMarkers({
  frame,
  modelScene,
  visible = false,
}: DebugShadowMarkersProps) {
  if (!visible) return null

  const shadowVertices: [number, number, number][] = []
  const buildingVertices: [number, number, number][] = []

  // 그림자 폴리곤 꼭짓점 (빨간 구) — backend 좌표 (Xe, Yn) → Three.js (Xe, 0.1, -Yn)
  if (frame?.polygons) {
    for (const poly of frame.polygons) {
      for (const [x, y] of poly.coordinates) {
        shadowVertices.push([x, 0.1, -y])
      }
    }
  }

  // 건물 메시 바운딩 박스 모서리 (파란 구)
  if (modelScene) {
    modelScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (!mesh.geometry.boundingBox) {
          mesh.geometry.computeBoundingBox()
        }
        const bb = mesh.geometry.boundingBox
        if (!bb) return
        // 8개 모서리 중 하단 4개만 (y=min)
        const corners = [
          new THREE.Vector3(bb.min.x, bb.min.y, bb.min.z),
          new THREE.Vector3(bb.max.x, bb.min.y, bb.min.z),
          new THREE.Vector3(bb.min.x, bb.min.y, bb.max.z),
          new THREE.Vector3(bb.max.x, bb.min.y, bb.max.z),
        ]
        for (const c of corners) {
          c.applyMatrix4(mesh.matrixWorld)
          buildingVertices.push([c.x, c.y, c.z])
        }
      }
    })
  }

  return (
    <group>
      {/* 그림자 폴리곤 꼭짓점 — 빨간 구 */}
      {shadowVertices.slice(0, 100).map((pos, i) => (
        <mesh key={`sv-${i}`} position={pos}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      ))}
      {/* 건물 모서리 — 파란 구 */}
      {buildingVertices.slice(0, 100).map((pos, i) => (
        <mesh key={`bv-${i}`} position={pos}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial color="#3b82f6" />
        </mesh>
      ))}
    </group>
  )
}
