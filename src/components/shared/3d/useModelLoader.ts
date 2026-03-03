'use client'

import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
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

    const group = new THREE.Group()

    const onLoad = (loaded: THREE.Object3D) => {
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
  }, [config])

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
