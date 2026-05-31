'use client'

import { useEffect, useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { BoundingBox } from '../types'
import type { SurfaceHit, SurfaceType } from './types'
import type { BuildingGroupInfo } from '@/lib/types/sunlight'
import {
  WIREFRAME_FACE_LIMIT,
  WIREFRAME_MATERIAL,
  GROUP_COLORS,
  findGroupForMesh,
} from '../buildingMaterials'

// ─── 기본 재질 ─────────────────────────────

const DEFAULT_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#d1d5db',
  roughness: 0.7,
  metalness: 0.1,
  side: THREE.DoubleSide,
})

// ─── 표면 유형 분류 ─────────────────────────────

function classifySurface(worldNormal: THREE.Vector3): SurfaceType {
  const absY = Math.abs(worldNormal.y)
  if (absY > 0.85) {
    return worldNormal.y > 0 ? 'roof' : 'ground'
  }
  return 'wall'
}

// ─── InteractiveBuildingModel ─────────────────────

interface InteractiveBuildingModelProps {
  scene: THREE.Group | null
  bbox: BoundingBox | null
  interactionEnabled?: boolean
  onSurfaceHover?: (hit: SurfaceHit | null) => void
  onSurfaceClick?: (hit: SurfaceHit) => void
  highlightColor?: string
  showWireframe?: boolean
  autoFitCamera?: boolean
  color?: string
  allowedSurfaces?: SurfaceType[]
  opacity?: number
  groups?: BuildingGroupInfo[]
  hiddenGroups?: Set<string>
  preserveOriginalMaterials?: boolean
}

export default function InteractiveBuildingModel({
  scene,
  interactionEnabled = false,
  onSurfaceHover,
  onSurfaceClick,
  highlightColor = '#fbbf24',
  showWireframe = true,
  color,
  allowedSurfaces,
  opacity,
  groups,
  hiddenGroups,
  preserveOriginalMaterials = false,
}: InteractiveBuildingModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const hoveredMeshRef = useRef<THREE.Mesh | null>(null)
  const originalMaterialRef = useRef<THREE.Material | null>(null)
  // 호버용으로 clone 한 하이라이트 material 만 추적해, 복원 시 공유 캐시 material 을
  // 실수로 dispose 하지 않도록 한다(아래 restoreHovered 참조).
  const hoverCloneRef = useRef<THREE.Material | null>(null)

  const material = useMemo(() => {
    if (!color && !opacity) return DEFAULT_MATERIAL
    return new THREE.MeshStandardMaterial({
      color: color || '#d1d5db',
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: opacity !== undefined && opacity < 1,
      opacity: opacity ?? 1,
    })
  }, [color, opacity])

  // 그룹별 material 캐시
  const groupMaterialCache = useMemo(() => {
    if (!groups || groups.length === 0) return null
    const cache = new Map<string, THREE.MeshStandardMaterial>()
    groups.forEach((g, i) => {
      cache.set(g.name, new THREE.MeshStandardMaterial({
        color: g.color || GROUP_COLORS[i % GROUP_COLORS.length],
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide,
        transparent: opacity !== undefined && opacity < 1,
        opacity: opacity ?? 1,
      }))
    })
    return cache
  }, [groups, opacity])

  const prevCacheRef = useRef<Map<string, THREE.MeshStandardMaterial> | null>(null)
  useEffect(() => {
    if (prevCacheRef.current && prevCacheRef.current !== groupMaterialCache) {
      prevCacheRef.current.forEach((mat) => mat.dispose())
    }
    prevCacheRef.current = groupMaterialCache
    return () => { groupMaterialCache?.forEach((mat) => mat.dispose()) }
  }, [groupMaterialCache])

  // 카메라 초기 배치는 ThreeViewer의 CameraController가 단독 소유한다.

  // 재질 적용 (그룹 색상 + 가시성 지원)
  useEffect(() => {
    if (!scene) return
    const gNames = groups?.map((g) => g.name) ?? []

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
        // 그룹 가시성 처리
        if (hiddenGroups && hiddenGroups.size > 0 && gNames.length > 0) {
          const groupName = findGroupForMesh(child, gNames)
          child.visible = !(groupName && hiddenGroups.has(groupName))
        } else {
          child.visible = true
        }

        if (!preserveOriginalMaterials) {
          if (groupMaterialCache && gNames.length > 0) {
            const groupName = findGroupForMesh(child, gNames)
            const groupMat = groupName ? groupMaterialCache.get(groupName) : null
            child.material = groupMat || material
          } else {
            child.material = material
          }
        }
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    // Phase 4: EdgesGeometry 지연 계산 (초기 렌더 우선, 와이어프레임 후추가)
    let edgeTimerId: ReturnType<typeof setTimeout> | null = null
    if (wireframeAllowed) {
      edgeTimerId = setTimeout(() => {
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh && child.geometry) {
            const existing = child.children.find((c) => c.userData.isEdgeLines)
            if (!existing) {
              const edges = new THREE.EdgesGeometry(child.geometry, 30)
              const lines = new THREE.LineSegments(edges, WIREFRAME_MATERIAL)
              lines.userData.isEdgeLines = true
              child.add(lines)
            }
          }
        })
      }, 0)
    }

    return () => {
      if (edgeTimerId) clearTimeout(edgeTimerId)
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
  }, [scene, material, showWireframe, preserveOriginalMaterials, groups, groupMaterialCache, hiddenGroups])

  // 호버 해제 시 원래 재질 복원
  const restoreHovered = useCallback(() => {
    const mesh = hoveredMeshRef.current
    const clone = hoverCloneRef.current
    // 메시 재질이 아직 우리 하이라이트 클론이면 원본으로 되돌린다. 재질 재적용 effect 가
    // 호버 도중 다른(공유 캐시) 재질로 이미 교체했다면 건드리지 않는다 — 그 공유 재질을
    // 원본으로 오인해 dispose 하면 같은 그룹 전 메시가 검게 렌더된다.
    if (mesh && originalMaterialRef.current && mesh.material === clone) {
      mesh.material = originalMaterialRef.current
    }
    // 우리가 만든 호버 클론만 해제한다(공유 캐시·원본 재질은 절대 dispose 하지 않음).
    if (clone && !Array.isArray(clone)) {
      clone.dispose()
    }
    hoveredMeshRef.current = null
    originalMaterialRef.current = null
    hoverCloneRef.current = null
  }, [])

  // 언마운트 시 남아있는 호버 하이라이트 정리
  useEffect(() => restoreHovered, [restoreHovered])

  // 그룹명 목록 (groups prop 기반)
  const groupNames = useMemo(() => groups?.map((g) => g.name) ?? [], [groups])

  // ThreeEvent에서 SurfaceHit 추출
  const extractHit = useCallback((e: ThreeEvent<PointerEvent | MouseEvent>): SurfaceHit | null => {
    if (!e.face) return null

    // 월드 법선 계산
    const worldNormal = e.face.normal.clone()
    worldNormal.transformDirection(e.object.matrixWorld)
    worldNormal.normalize()

    const surfaceType = classifySurface(worldNormal)

    // 허용 표면 필터링
    if (allowedSurfaces && !allowedSurfaces.includes(surfaceType)) {
      return null
    }

    // 그룹명 추출
    const groupName = groupNames.length > 0
      ? findGroupForMesh(e.object, groupNames) ?? undefined
      : undefined

    return {
      point: [e.point.x, e.point.y, e.point.z],
      normal: [worldNormal.x, worldNormal.y, worldNormal.z],
      faceIndex: e.faceIndex ?? -1,
      objectName: e.object.name || e.object.uuid,
      surfaceType,
      distance: e.distance,
      groupName,
    }
  }, [allowedSurfaces, groupNames])

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!interactionEnabled) return
    e.stopPropagation()

    const hit = extractHit(e)
    if (!hit) {
      restoreHovered()
      onSurfaceHover?.(null)
      return
    }

    onSurfaceHover?.(hit)

    // 호버 하이라이트
    const mesh = e.object as THREE.Mesh
    if (mesh !== hoveredMeshRef.current) {
      restoreHovered()
      hoveredMeshRef.current = mesh
      originalMaterialRef.current = mesh.material as THREE.Material
      const hlMat = (mesh.material as THREE.MeshStandardMaterial).clone()
      hlMat.emissive = new THREE.Color(highlightColor)
      hlMat.emissiveIntensity = 0.3
      hoverCloneRef.current = hlMat
      mesh.material = hlMat
    }
  }, [interactionEnabled, extractHit, onSurfaceHover, highlightColor, restoreHovered])

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    if (!interactionEnabled) return
    e.stopPropagation()

    const hit = extractHit(e)
    if (hit) {
      onSurfaceClick?.(hit)
    }
  }, [interactionEnabled, extractHit, onSurfaceClick])

  const handlePointerLeave = useCallback(() => {
    restoreHovered()
    onSurfaceHover?.(null)
  }, [restoreHovered, onSurfaceHover])

  if (!scene) return null

  return (
    <group
      ref={groupRef}
      onPointerMove={interactionEnabled ? handlePointerMove : undefined}
      onClick={interactionEnabled ? handleClick : undefined}
      onPointerLeave={interactionEnabled ? handlePointerLeave : undefined}
    >
      <primitive object={scene} />
    </group>
  )
}
