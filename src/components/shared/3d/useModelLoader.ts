'use client'

import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { ModelConfig, BoundingBox, ModelLoadResult, ModelLoadState, ModelEntry, LoadedModel, MultiModelLoadResult } from './types'

function computeBBox(object: THREE.Object3D): BoundingBox {
  const box = new THREE.Box3().setFromObject(object)
  const center = new THREE.Vector3()
  const size = new THREE.Vector3()
  box.getCenter(center)
  box.getSize(size)

  return {
    min: box.min.toArray() as [number, number, number],
    max: box.max.toArray() as [number, number, number],
    center: center.toArray() as [number, number, number],
    size: size.toArray() as [number, number, number],
  }
}

function centerModel(object: THREE.Object3D, bbox: BoundingBox): void {
  object.position.set(-bbox.center[0], -bbox.min[1], -bbox.center[2])
}

/**
 * 그룹 노드 내의 모든 Mesh를 단일 BufferGeometry로 병합.
 * draw call을 그룹 수만큼(10-20)으로 감소시킴.
 */
function mergeByGroup(root: THREE.Object3D): void {
  // 최상위 children(그룹 노드) 순회 — shallow copy로 안전하게
  const topChildren = [...root.children]

  for (const groupNode of topChildren) {
    const meshes: THREE.Mesh[] = []
    groupNode.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        meshes.push(child)
      }
    })

    // 메시 1개 이하면 병합 불필요
    if (meshes.length <= 1) continue

    // 각 메시의 world transform을 geometry에 bake
    const geometries: THREE.BufferGeometry[] = []
    let firstMaterial: THREE.Material | THREE.Material[] | null = null

    for (const mesh of meshes) {
      mesh.updateWorldMatrix(true, false)
      const geo = mesh.geometry.clone()

      // UV 속성 일관성: 일부 메시에만 uv가 있으면 strip
      // (mergeGeometries가 속성 불일치 시 실패하므로)
      geo.applyMatrix4(mesh.matrixWorld)

      if (!firstMaterial) {
        firstMaterial = mesh.material
      }
      geometries.push(geo)
    }

    // UV 속성 일관성 보장
    const hasUv = geometries.map((g) => !!g.attributes.uv)
    const allHaveUv = hasUv.every(Boolean)
    const noneHaveUv = hasUv.every((v) => !v)

    if (!allHaveUv && !noneHaveUv) {
      // 일부만 UV가 있으면 모두 제거 (색상 기반 렌더링이라 UV 불필요)
      for (const geo of geometries) {
        geo.deleteAttribute('uv')
      }
    }

    // normal 속성도 동일하게 처리
    const hasNormal = geometries.map((g) => !!g.attributes.normal)
    const allHaveNormal = hasNormal.every(Boolean)
    const noneHaveNormal = hasNormal.every((v) => !v)
    if (!allHaveNormal && !noneHaveNormal) {
      for (const geo of geometries) {
        if (!geo.attributes.normal) {
          geo.computeVertexNormals()
        }
      }
    }

    const merged = mergeGeometries(geometries, false)
    if (!merged) {
      // 병합 실패 시 원본 유지
      geometries.forEach((g) => g.dispose())
      continue
    }

    // 병합된 geometry를 단일 Mesh로 생성
    const mergedMesh = new THREE.Mesh(
      merged,
      firstMaterial || new THREE.MeshStandardMaterial({ color: '#d1d5db' }),
    )
    mergedMesh.name = groupNode.name

    // baked geometry의 소스 클론 dispose
    geometries.forEach((g) => g.dispose())

    // 기존 메시 cleanup 및 교체
    // groupNode의 children을 제거하고 merged mesh를 추가
    // identity transform (world transform이 이미 baked)
    const parent = groupNode.parent
    if (parent) {
      const idx = parent.children.indexOf(groupNode)

      // 새 그룹 노드 생성 (이름 보존)
      const newGroup = new THREE.Group()
      newGroup.name = groupNode.name
      newGroup.add(mergedMesh)
      // merged mesh의 world transform은 이미 bake되었으므로 그룹은 identity
      mergedMesh.position.set(0, 0, 0)
      mergedMesh.rotation.set(0, 0, 0)
      mergedMesh.scale.set(1, 1, 1)

      // 기존 그룹 노드의 메시 dispose
      groupNode.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
        }
      })

      parent.children[idx] = newGroup
      newGroup.parent = parent
      groupNode.parent = null
    }
  }

  // 진단 로그
  let meshCount = 0
  root.traverse((c) => { if (c instanceof THREE.Mesh) meshCount++ })
  console.log(`[BoLumiCloud] Merged: ${meshCount} meshes (draw calls)`)
}

const MODEL_LOAD_TIMEOUT = 30000

export function useModelLoader(config: ModelConfig | null): ModelLoadResult {
  const [state, setState] = useState<ModelLoadState>('idle')
  const [scene, setScene] = useState<THREE.Group | null>(null)
  const [bbox, setBbox] = useState<BoundingBox | null>(null)
  const [error, setError] = useState<string | null>(null)
  const prevUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!config || config.url === prevUrlRef.current) return
    prevUrlRef.current = config.url

    setState('loading')
    setError(null)

    let settled = false
    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true
        setError('모델 로드 시간이 초과되었습니다. 파일 크기를 확인하거나 다시 시도하세요.')
        setState('error')
      }
    }, MODEL_LOAD_TIMEOUT)

    const group = new THREE.Group()

    const onLoad = (loaded: THREE.Object3D) => {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      // Z-up → Y-up 좌표 변환
      // OBJ 원본 및 trimesh 경유 GLB 모두 Z-up 좌표계를 유지하므로 회전 필요
      if (config.zUp !== false) {
        loaded.rotation.x = -Math.PI / 2
        loaded.updateMatrixWorld(true)
      }

      // 법선 재계산: trimesh GLB 변환 시 법선 소실/뒤집힘 방지
      loaded.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          child.geometry.computeVertexNormals()
        }
      })

      group.add(loaded)

      // Per-group 메시 병합 (draw call 최소화)
      if (config.mergeGroups !== false) {
        loaded.updateMatrixWorld(true)
        mergeByGroup(loaded)
      }

      let b = computeBBox(group)

      if (config.autoCenter !== false) {
        centerModel(group, b)
        group.updateMatrixWorld(true)
        b = computeBBox(group)
      }

      setBbox(b)
      setScene(group)
      setState('loaded')
    }

    const onError = (err: unknown) => {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      const msg = err instanceof Error ? err.message : '모델 로딩 실패'
      setError(msg)
      setState('error')
    }

    if (config.format === 'obj') {
      const loader = new OBJLoader()
      loader.load(config.url, onLoad, undefined, onError)
    } else {
      const loader = new GLTFLoader()
      loader.load(
        config.url,
        (gltf) => onLoad(gltf.scene),
        undefined,
        onError,
      )
    }

    return () => {
      clearTimeout(timeoutId)
      settled = true
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material?.dispose()
          }
        }
      })
    }
  }, [config?.url, config?.format, config?.autoCenter, config?.zUp, config?.mergeGroups])

  return { state, scene, bbox, error }
}

export function useMultiModelLoader(entries: ModelEntry[]): MultiModelLoadResult {
  const [models, setModels] = useState<LoadedModel[]>([])
  const [combinedBbox, setCombinedBbox] = useState<BoundingBox | null>(null)
  const prevEntriesRef = useRef<string>('')

  useEffect(() => {
    const key = JSON.stringify(entries.map(e => e.config.url))
    if (key === prevEntriesRef.current) return
    prevEntriesRef.current = key

    if (entries.length === 0) {
      setModels([])
      setCombinedBbox(null)
      return
    }

    // Initialize loading states
    const initial: LoadedModel[] = entries.map(e => ({
      id: e.id,
      state: 'loading' as ModelLoadState,
      scene: null,
      bbox: null,
      error: null,
    }))
    setModels(initial)

    // Track groups for cleanup
    const groups: THREE.Group[] = []

    // Load each model
    entries.forEach((entry, idx) => {
      const group = new THREE.Group()
      groups.push(group)

      const onLoad = (loaded: THREE.Object3D) => {
        if (entry.config.zUp !== false) {
          loaded.rotation.x = -Math.PI / 2
          loaded.updateMatrixWorld(true)
        }
        // 법선 재계산
        loaded.traverse((child) => {
          if (child instanceof THREE.Mesh && child.geometry) {
            child.geometry.computeVertexNormals()
          }
        })
        group.add(loaded)

        // Per-group 메시 병합
        if (entry.config.mergeGroups !== false) {
          loaded.updateMatrixWorld(true)
          mergeByGroup(loaded)
        }

        let b = computeBBox(group)
        if (entry.config.autoCenter !== false) {
          centerModel(group, b)
          group.updateMatrixWorld(true)
          b = computeBBox(group)
        }

        setModels(prev => {
          const updated = [...prev]
          updated[idx] = { id: entry.id, state: 'loaded', scene: group, bbox: b, error: null }
          return updated
        })
      }

      const onError = (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Load failed'
        setModels(prev => {
          const updated = [...prev]
          updated[idx] = { id: entry.id, state: 'error', scene: null, bbox: null, error: msg }
          return updated
        })
      }

      if (entry.config.format === 'obj') {
        const loader = new OBJLoader()
        loader.load(entry.config.url, onLoad, undefined, onError)
      } else {
        const loader = new GLTFLoader()
        loader.load(entry.config.url, (gltf) => onLoad(gltf.scene), undefined, onError)
      }
    })

    return () => {
      // Dispose geometries and materials to prevent GPU memory leaks
      groups.forEach(group => {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose()
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose())
            } else {
              child.material?.dispose()
            }
          }
        })
      })
    }
  }, [entries])

  // Compute combined bbox when all loaded
  useEffect(() => {
    const loaded = models.filter(m => m.state === 'loaded' && m.bbox)
    if (loaded.length === 0) {
      setCombinedBbox(null)
      return
    }

    const allMin = [Infinity, Infinity, Infinity] as [number, number, number]
    const allMax = [-Infinity, -Infinity, -Infinity] as [number, number, number]

    for (const m of loaded) {
      if (!m.bbox) continue
      for (let i = 0; i < 3; i++) {
        allMin[i] = Math.min(allMin[i], m.bbox.min[i])
        allMax[i] = Math.max(allMax[i], m.bbox.max[i])
      }
    }

    const center: [number, number, number] = [
      (allMin[0] + allMax[0]) / 2,
      (allMin[1] + allMax[1]) / 2,
      (allMin[2] + allMax[2]) / 2,
    ]
    const size: [number, number, number] = [
      allMax[0] - allMin[0],
      allMax[1] - allMin[1],
      allMax[2] - allMin[2],
    ]

    setCombinedBbox({ min: allMin, max: allMax, center, size })
  }, [models])

  const isAllLoaded = models.length > 0 && models.every(m => m.state === 'loaded')

  return { models, combinedBbox, isAllLoaded }
}
