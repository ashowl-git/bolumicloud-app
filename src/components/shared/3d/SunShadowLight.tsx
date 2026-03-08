'use client'

import { useRef, useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
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
  const { invalidate, camera } = useThree()

  // Dynamic frustum sizing refs
  const maxCamSizeRef = useRef(600)
  const currentCamSizeRef = useRef(600)
  const horizDiagRef = useRef(200)

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
    const dist = diag * 3

    return [
      modelBbox.center[0] + (x / mag) * dist,
      modelBbox.center[1] + (y / mag) * dist,
      modelBbox.center[2] + (z / mag) * dist,
    ] as [number, number, number]
  }, [sunDirection, modelBbox])

  // Compute max frustum size from sun altitude + store in ref for useFrame
  useEffect(() => {
    if (!lightRef.current || !modelBbox) return

    const horizDiag = Math.sqrt(modelBbox.size[0] ** 2 + modelBbox.size[2] ** 2)
    const buildingHeight = modelBbox.size[1]
    horizDiagRef.current = horizDiag

    let shadowFactor = 6
    if (sunDirection) {
      const [sx, sy, sz] = sunDirection
      const mag = Math.sqrt(sx * sx + sy * sy + sz * sz)
      if (mag > 0.01) {
        const altRad = Math.asin(Math.abs(sy) / mag)
        shadowFactor = altRad > 0.01 ? Math.min(1 / Math.tan(altRad), 15) : 15
      }
    }
    shadowFactor = Math.max(shadowFactor, 3)

    const maxCamSize = Math.max(horizDiag * 3, horizDiag + buildingHeight * shadowFactor)
    maxCamSizeRef.current = maxCamSize
    currentCamSizeRef.current = maxCamSize

    // Set initial frustum (useFrame will dynamically adjust from here)
    const cam = lightRef.current.shadow.camera
    cam.left = -maxCamSize
    cam.right = maxCamSize
    cam.top = maxCamSize
    cam.bottom = -maxCamSize

    const diag = Math.sqrt(
      modelBbox.size[0] ** 2 +
      modelBbox.size[1] ** 2 +
      modelBbox.size[2] ** 2
    )
    cam.near = 0.5
    cam.far = Math.max(diag * 6, maxCamSize * 4)
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
  }, [modelBbox, sunDirection, invalidate])

  // Dynamic frustum: adjust shadow camera size based on camera distance each frame
  useFrame(() => {
    if (!lightRef.current || !modelBbox) return

    const horizDiag = horizDiagRef.current
    const maxCamSize = maxCamSizeRef.current
    const minFrustum = Math.max(horizDiag * 0.15, 10)

    const orbitTarget = new THREE.Vector3(
      modelBbox.center[0], modelBbox.center[1], modelBbox.center[2]
    )

    const dist = camera.position.distanceTo(orbitTarget)
    const t = Math.max(0, Math.min(1, (dist - horizDiag * 0.05) / (horizDiag * 2.5)))
    const desiredSize = minFrustum + t * (maxCamSize - minFrustum)

    // Skip update if change < 2%
    if (Math.abs(desiredSize - currentCamSizeRef.current) / (currentCamSizeRef.current || 1) < 0.02) {
      return
    }

    // Smooth lerp toward desired size
    const newSize = currentCamSizeRef.current + (desiredSize - currentCamSizeRef.current) * 0.3
    currentCamSizeRef.current = newSize

    const cam = lightRef.current.shadow.camera
    cam.left = -newSize
    cam.right = newSize
    cam.top = newSize
    cam.bottom = -newSize

    const diag = Math.sqrt(
      modelBbox.size[0] ** 2 +
      modelBbox.size[1] ** 2 +
      modelBbox.size[2] ** 2
    )
    cam.near = 0.5
    cam.far = Math.max(diag * 6, newSize * 4)
    cam.updateProjectionMatrix()

    // Dynamic bias: larger frustum = larger texels = more bias needed
    const biasScale = newSize / 600
    lightRef.current.shadow.bias = -0.0003 * Math.max(biasScale, 0.3)

    lightRef.current.shadow.needsUpdate = true
    invalidate()
  })

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
