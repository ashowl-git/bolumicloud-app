'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoundingBox } from './types'

interface SunShadowLightProps {
  sunDirection?: [number, number, number]
  modelBbox?: BoundingBox | null
  ambientIntensity?: number
  directionalIntensity?: number
}

export default function SunShadowLight({
  sunDirection = [50, 80, -30],
  modelBbox,
  ambientIntensity = 0.6,
  directionalIntensity = 0.8,
}: SunShadowLightProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const { invalidate } = useThree()

  // Normalize sunDirection and scale to bbox diagonal × 2,
  // offset from model center so the light is always far enough
  const scaledPosition = useMemo(() => {
    if (!modelBbox || !sunDirection) return sunDirection
    const [x, y, z] = sunDirection
    const mag = Math.sqrt(x * x + y * y + z * z)
    if (mag < 0.01) return sunDirection

    const diag = Math.sqrt(
      modelBbox.size[0] ** 2 +
      modelBbox.size[1] ** 2 +
      modelBbox.size[2] ** 2
    )
    const dist = diag * 2

    return [
      modelBbox.center[0] + (x / mag) * dist,
      modelBbox.center[1] + (y / mag) * dist,
      modelBbox.center[2] + (z / mag) * dist,
    ] as [number, number, number]
  }, [sunDirection, modelBbox])

  // Dynamically fit shadow camera frustum to model bounding box
  useEffect(() => {
    if (!lightRef.current || !modelBbox) return

    const cam = lightRef.current.shadow.camera
    const maxSpan = Math.max(modelBbox.size[0], modelBbox.size[2])
    const camSize = maxSpan * 1.5

    const diag = Math.sqrt(
      modelBbox.size[0] ** 2 +
      modelBbox.size[1] ** 2 +
      modelBbox.size[2] ** 2
    )

    cam.left = -camSize
    cam.right = camSize
    cam.top = camSize
    cam.bottom = -camSize
    cam.near = 0.5
    cam.far = diag * 4

    cam.updateProjectionMatrix()

    // Point light target at model center
    lightRef.current.target.position.set(
      modelBbox.center[0], modelBbox.center[1], modelBbox.center[2]
    )
    if (!lightRef.current.target.parent) {
      lightRef.current.parent?.add(lightRef.current.target)
    }
    lightRef.current.target.updateMatrixWorld()

    lightRef.current.shadow.needsUpdate = true
    invalidate()
  }, [modelBbox, invalidate])

  // Invalidate on sun direction change (frameloop="demand" compatibility)
  useEffect(() => {
    if (!lightRef.current || !modelBbox) return

    // Update target on every sun direction change
    lightRef.current.target.position.set(
      modelBbox.center[0], modelBbox.center[1], modelBbox.center[2]
    )
    lightRef.current.target.updateMatrixWorld()

    lightRef.current.shadow.needsUpdate = true
    invalidate()
  }, [sunDirection, modelBbox, invalidate])

  return (
    <>
      <ambientLight intensity={ambientIntensity} color="#ffffff" />
      <directionalLight
        ref={lightRef}
        position={scaledPosition}
        intensity={directionalIntensity}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-bias={-0.0003}
        shadow-normalBias={0.05}
      />
      <hemisphereLight args={['#87ceeb', '#f5f5f0', 0.3]} />
    </>
  )
}
