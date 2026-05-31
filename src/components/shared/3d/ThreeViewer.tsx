'use client'

import { Suspense, useRef, useMemo, useState, useEffect, type ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { BoundingBox } from './types'

// ─── 폴백 UI ─────────────────────────────

function WebGLFallback() {
  return (
    <div className="border border-gray-200 p-8 text-center">
      <p className="text-sm text-gray-600">WebGL2를 지원하지 않는 브라우저입니다.</p>
      <p className="text-xs text-gray-400 mt-1">Chrome, Firefox, Edge 최신 버전을 사용해주세요.</p>
    </div>
  )
}

// ─── bbox 기반 카메라 동적 제어 ─────────────────────────────

function CameraController({ bbox }: { bbox?: BoundingBox | null }) {
  const { camera } = useThree()
  const appliedRef = useRef<string>('')

  useEffect(() => {
    if (!bbox) return

    const key = bbox.size.join(',')
    if (key === appliedRef.current) return
    appliedRef.current = key

    const maxDim = Math.max(...bbox.size)
    const dist = maxDim * 1.8

    camera.near = Math.max(0.1, maxDim * 0.001)
    camera.far = Math.max(10000, maxDim * 10)
    camera.position.set(
      bbox.center[0] + dist,
      bbox.center[1] + dist * 0.7,
      bbox.center[2] + dist
    )
    camera.updateProjectionMatrix()
    camera.lookAt(bbox.center[0], bbox.center[1], bbox.center[2])
  }, [bbox, camera])

  return null
}


// ─── ThreeViewer ─────────────────────────────

interface ThreeViewerProps {
  children: ReactNode
  bbox?: BoundingBox | null
  height?: string
  className?: string
  enableDamping?: boolean
  orbitEnabled?: boolean
  enableShadows?: boolean
}

export default function ThreeViewer({
  children,
  bbox,
  height = '400px',
  className = '',
  enableDamping = true,
  orbitEnabled = true,
  enableShadows = false,
}: ThreeViewerProps) {
  const [webglAvailable, setWebglAvailable] = useState(true)

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const available = !!(canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2'))
      setWebglAvailable(available)
    } catch {
      setWebglAvailable(false)
    }
  }, [])

  const isFluid = height === '100%'
  const maxDim = bbox ? Math.max(...bbox.size) : 0

  const orbitTarget = useMemo(
    () => bbox
      ? new THREE.Vector3(bbox.center[0], bbox.center[1], bbox.center[2])
      : new THREE.Vector3(0, 0, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bbox?.center[0], bbox?.center[1], bbox?.center[2]]
  )

  if (!webglAvailable) return <WebGLFallback />

  return (
    <div
      className={`relative ${isFluid ? 'w-full h-full' : ''} ${className}`}
      style={isFluid ? { cursor: orbitEnabled ? 'grab' : 'crosshair' } : { height, cursor: orbitEnabled ? 'grab' : 'crosshair' }}
    >
      <Canvas
        frameloop="always"
        dpr={[1, 1.5]}
        shadows={enableShadows ? { type: THREE.PCFSoftShadowMap } : undefined}
        camera={{
          position: [20, 15, 20],
          fov: 50,
          near: 0.1,
          far: 10000,
        }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#f8fafc')
          gl.toneMapping = 0 // NoToneMapping
        }}
      >
        <CameraController bbox={bbox} />
        <Suspense fallback={null}>
          {children}
        </Suspense>
        <OrbitControls
          makeDefault
          enabled={orbitEnabled}
          enableDamping={enableDamping}
          dampingFactor={0.05}
          minDistance={maxDim > 0 ? Math.max(1, maxDim * 0.01) : 1}
          maxDistance={maxDim > 0 ? Math.max(5000, maxDim * 5) : 5000}
          target={orbitTarget}
          maxPolarAngle={Math.PI * 0.85}
        />
      </Canvas>
    </div>
  )
}
