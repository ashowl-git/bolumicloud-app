'use client'

import { useEffect, useRef, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoundingBox } from './types'
import type { BuildingGroupInfo } from '@/lib/types/sunlight'

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

// ─── 그룹별 색상 팔레트 ─────────────────────────

const GROUP_COLORS = [
  '#7CB9E8', '#B284BE', '#72BF6A', '#F0A868', '#E8747C',
  '#6ECFCF', '#D4A76A', '#9B9B9B', '#A8D8B9', '#C4B5E0',
]

// ─── BuildingModel ─────────────────────────────

interface BuildingModelProps {
  scene: THREE.Group | null
  bbox: BoundingBox | null
  showWireframe?: boolean
  autoFitCamera?: boolean
  color?: string
  groups?: BuildingGroupInfo[]
  selectedGroup?: string | null
  onGroupSelect?: (name: string | null) => void
}

export default function BuildingModel({
  scene,
  bbox,
  showWireframe = true,
  autoFitCamera = true,
  color,
  groups,
  selectedGroup,
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
      <MaterialApplicator
        scene={scene}
        material={material}
        showWireframe={showWireframe}
        groups={groups}
        selectedGroup={selectedGroup}
      />
    </group>
  )
}

// ─── 그룹명에서 메시가 속한 그룹을 찾는 헬퍼 ─────────

function findGroupForMesh(mesh: THREE.Mesh, groupNames: string[]): string | null {
  // 메시 자체 이름 또는 부모 이름으로 그룹 매칭
  let current: THREE.Object3D | null = mesh
  while (current) {
    if (current.name) {
      const matched = groupNames.find((g) => current!.name === g || current!.name.startsWith(g))
      if (matched) return matched
    }
    current = current.parent
  }
  return null
}

// ─── 재질 적용 헬퍼 ─────────────────────────────

function MaterialApplicator({
  scene,
  material,
  showWireframe,
  groups,
  selectedGroup,
}: {
  scene: THREE.Group
  material: THREE.Material
  showWireframe: boolean
  groups?: BuildingGroupInfo[]
  selectedGroup?: string | null
}) {
  // 그룹명 -> 색상 맵 생성
  const groupColorMap = useMemo(() => {
    if (!groups || groups.length === 0) return null
    const map = new Map<string, string>()
    groups.forEach((g, i) => {
      map.set(g.name, g.color || GROUP_COLORS[i % GROUP_COLORS.length])
    })
    return map
  }, [groups])

  useEffect(() => {
    const groupNames = groupColorMap ? Array.from(groupColorMap.keys()) : []

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // 그룹 기반 렌더링
        if (groupColorMap && groupNames.length > 0) {
          const groupName = findGroupForMesh(child, groupNames)
          const groupColor = groupName ? groupColorMap.get(groupName) : null

          const mat = new THREE.MeshStandardMaterial({
            color: groupColor || '#d1d5db',
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide,
          })

          // 선택 그룹 하이라이트 / 비선택 그룹 감쇠
          if (selectedGroup) {
            if (groupName === selectedGroup) {
              mat.emissive = new THREE.Color(groupColor || '#ffffff')
              mat.emissiveIntensity = 0.15
            } else {
              mat.transparent = true
              mat.opacity = 0.4
            }
          }

          child.material = mat
        } else {
          // 기존 단일 색상 동작
          child.material = material
        }

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
  }, [scene, material, showWireframe, groupColorMap, selectedGroup])

  return null
}
