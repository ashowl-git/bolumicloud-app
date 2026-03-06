'use client'

import { useEffect, useRef, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoundingBox } from './types'
import type { BuildingGroupInfo } from '@/lib/types/sunlight'

// EdgesGeometry 생성 임계값: 총 face 수가 이 값 초과 시 와이어프레임 비활성화
const WIREFRAME_FACE_LIMIT = 50000

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
  preserveOriginalMaterials?: boolean
}

export default function BuildingModel({
  scene,
  bbox,
  showWireframe = true,
  autoFitCamera = true,
  color,
  groups,
  selectedGroup,
  preserveOriginalMaterials = false,
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
        preserveOriginalMaterials={preserveOriginalMaterials}
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
  preserveOriginalMaterials = false,
}: {
  scene: THREE.Group
  material: THREE.Material
  showWireframe: boolean
  groups?: BuildingGroupInfo[]
  selectedGroup?: string | null
  preserveOriginalMaterials?: boolean
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

  // 그룹별 material 캐시 (dispose 관리 포함)
  const groupMaterialCache = useMemo(() => {
    if (!groupColorMap) return null
    const cache = new Map<string, THREE.MeshStandardMaterial>()
    groupColorMap.forEach((color, name) => {
      cache.set(name, new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide,
      }))
    })
    // 기본 색상용 fallback
    cache.set('__default__', new THREE.MeshStandardMaterial({
      color: '#d1d5db',
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide,
    }))
    return cache
  }, [groupColorMap])

  // 이전 캐시 dispose
  const prevCacheRef = useRef<Map<string, THREE.MeshStandardMaterial> | null>(null)
  useEffect(() => {
    if (prevCacheRef.current && prevCacheRef.current !== groupMaterialCache) {
      prevCacheRef.current.forEach((mat) => mat.dispose())
    }
    prevCacheRef.current = groupMaterialCache
    return () => {
      groupMaterialCache?.forEach((mat) => mat.dispose())
    }
  }, [groupMaterialCache])

  useEffect(() => {
    const groupNames = groupColorMap ? Array.from(groupColorMap.keys()) : []

    // 총 face 수 계산 (EdgesGeometry 생성 여부 결정)
    let totalFaces = 0
    if (showWireframe) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          const idx = child.geometry.index
          totalFaces += idx ? idx.count / 3 : (child.geometry.attributes.position?.count ?? 0) / 3
        }
      })
    }
    const wireframeAllowed = showWireframe && totalFaces <= WIREFRAME_FACE_LIMIT

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // 원본 재질 보존 모드: GLB의 재질을 그대로 유지
        if (preserveOriginalMaterials && !groupMaterialCache) {
          // 원본 재질 유지, shadow 설정만 적용
          child.castShadow = true
          child.receiveShadow = true
          return
        }

        // 그룹 기반 렌더링
        if (groupMaterialCache && groupNames.length > 0) {
          const groupName = findGroupForMesh(child, groupNames)
          const baseMat = groupName
            ? groupMaterialCache.get(groupName)
            : groupMaterialCache.get('__default__')

          if (baseMat) {
            // 선택 그룹 하이라이트 시 클론 사용
            if (selectedGroup) {
              const mat = baseMat.clone()
              if (groupName === selectedGroup) {
                mat.emissive = new THREE.Color(baseMat.color)
                mat.emissiveIntensity = 0.15
              } else {
                mat.transparent = true
                mat.opacity = 0.4
              }
              child.material = mat
            } else {
              child.material = baseMat
            }
          }
        } else {
          child.material = material
        }

        child.castShadow = true
        child.receiveShadow = true

        // 와이어프레임 에지 (face 수 임계값 이하일 때만)
        if (wireframeAllowed) {
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
    return () => {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const edgeLines = child.children.filter((c) => c.userData.isEdgeLines)
          edgeLines.forEach((c) => {
            if (c instanceof THREE.LineSegments) c.geometry.dispose()
            child.remove(c)
          })
        }
      })
    }
  }, [scene, material, showWireframe, groupMaterialCache, groupColorMap, selectedGroup, preserveOriginalMaterials])

  return null
}
