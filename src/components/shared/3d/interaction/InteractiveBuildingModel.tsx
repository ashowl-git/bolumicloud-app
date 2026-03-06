'use client'

import { useEffect, useRef, useMemo, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { BoundingBox } from '../types'
import type { SurfaceHit, SurfaceType } from './types'
import type { BuildingGroupInfo } from '@/lib/types/sunlight'

// ─── 기본 재질 ─────────────────────────────

const DEFAULT_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#d1d5db',
  roughness: 0.7,
  metalness: 0.1,
  side: THREE.DoubleSide,
})

const WIREFRAME_MATERIAL = new THREE.LineBasicMaterial({
  color: '#9ca3af',
  linewidth: 1,
})

// ─── 표면 유형 분류 ─────────────────────────────

function classifySurface(worldNormal: THREE.Vector3): SurfaceType {
  const absY = Math.abs(worldNormal.y)
  if (absY > 0.85) {
    return worldNormal.y > 0 ? 'roof' : 'ground'
  }
  return 'wall'
}

// ─── 메시에서 그룹명 추출 ─────────────────────────

function findGroupNameForMesh(mesh: THREE.Object3D, groupNames: string[]): string | undefined {
  let current: THREE.Object3D | null = mesh
  while (current) {
    if (current.name) {
      const matched = groupNames.find((g) => current!.name === g || current!.name.startsWith(g))
      if (matched) return matched
    }
    current = current.parent
  }
  return undefined
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
  preserveOriginalMaterials?: boolean
}

export default function InteractiveBuildingModel({
  scene,
  bbox,
  interactionEnabled = false,
  onSurfaceHover,
  onSurfaceClick,
  highlightColor = '#fbbf24',
  showWireframe = true,
  autoFitCamera = true,
  color,
  allowedSurfaces,
  opacity,
  groups,
  preserveOriginalMaterials = false,
}: InteractiveBuildingModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const hoveredMeshRef = useRef<THREE.Mesh | null>(null)
  const originalMaterialRef = useRef<THREE.Material | null>(null)
  const { camera } = useThree()

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

  // 재질 적용
  useEffect(() => {
    if (!scene) return
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (!preserveOriginalMaterials) {
          child.material = material
        }
        child.castShadow = true
        child.receiveShadow = true

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
  }, [scene, material, showWireframe, preserveOriginalMaterials])

  // 호버 해제 시 원래 재질 복원
  const restoreHovered = useCallback(() => {
    if (hoveredMeshRef.current && originalMaterialRef.current) {
      hoveredMeshRef.current.material = originalMaterialRef.current
    }
    hoveredMeshRef.current = null
    originalMaterialRef.current = null
  }, [])

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
      ? findGroupNameForMesh(e.object, groupNames)
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
