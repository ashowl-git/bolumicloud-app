'use client'

import { useEffect, useRef, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoundingBox } from './types'

// ─── 건물 재질 ─────────────────────────────

const BUILDING_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#d1d5db',
  roughness: 0.7,
  metalness: 0.1,
  side: THREE.DoubleSide,
})

const WIREFRAME_MATERIAL = new THREE.LineBasicMaterial({
  color: '#9ca3af',
  linewidth: 1,
})

// ─── BuildingModel ─────────────────────────────

interface BuildingModelProps {
  scene: THREE.Group | null
  bbox: BoundingBox | null
  showWireframe?: boolean
  autoFitCamera?: boolean
  color?: string
}

export default function BuildingModel({
  scene,
  bbox,
  showWireframe = true,
  autoFitCamera = true,
  color,
}: BuildingModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()

  const material = useMemo(() => {
    if (!color) return BUILDING_MATERIAL
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide,
    })
  }, [color])

  // 카메라 자동 맞춤
  useEffect(() => {
    if (!autoFitCamera || !bbox || !camera) return

    const maxDim = Math.max(...bbox.size)
    const dist = maxDim * 1.8

    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(dist, dist * 0.7, dist)
      camera.lookAt(0, bbox.size[1] * 0.3, 0)
      camera.updateProjectionMatrix()
    }
  }, [bbox, camera, autoFitCamera])

  if (!scene) return null

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
      <MaterialApplicator scene={scene} material={material} showWireframe={showWireframe} />
    </group>
  )
}

// ─── 재질 적용 헬퍼 ─────────────────────────────

function MaterialApplicator({
  scene,
  material,
  showWireframe,
}: {
  scene: THREE.Group
  material: THREE.Material
  showWireframe: boolean
}) {
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material
        child.castShadow = true
        child.receiveShadow = true

        // 와이어프레임 에지
        if (showWireframe) {
          const existing = child.children.find((c) => c.userData.isEdgeLines)
          if (!existing) {
            const edges = new THREE.EdgesGeometry(child.geometry, 30)
            const lines = new THREE.LineSegments(edges, WIREFRAME_MATERIAL)
            lines.userData.isEdgeLines = true
            child.add(lines)
          }
        }
      }
    })
  }, [scene, material, showWireframe])

  return null
}
