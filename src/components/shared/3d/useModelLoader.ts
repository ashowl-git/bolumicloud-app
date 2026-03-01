'use client'

import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { ModelConfig, BoundingBox, ModelLoadResult, ModelLoadState } from './types'

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
      group.add(loaded)
      const b = computeBBox(group)

      if (config.autoCenter !== false) {
        centerModel(group, b)
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
