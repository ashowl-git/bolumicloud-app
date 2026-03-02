'use client'

import { Suspense, useMemo, useState, useEffect, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
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

// ─── ThreeViewer ─────────────────────────────

interface ThreeViewerProps {
  children: ReactNode
  bbox?: BoundingBox | null
  height?: string
  className?: string
  enableDamping?: boolean
  orbitEnabled?: boolean
}

export default function ThreeViewer({
  children,
  bbox,
  height = '400px',
  className = '',
  enableDamping = true,
  orbitEnabled = true,
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

  const cameraConfig = useMemo(() => {
    if (!bbox) return { position: [20, 15, 20] as [number, number, number], fov: 50 }

    const maxDim = Math.max(...bbox.size)
    const dist = maxDim * 1.8
    return {
      position: [dist, dist * 0.7, dist] as [number, number, number],
      fov: 50,
    }
  }, [bbox])

  if (!webglAvailable) return <WebGLFallback />

  return (
    <div className={`relative ${className}`} style={{ height, cursor: orbitEnabled ? 'grab' : 'crosshair' }}>
      <Canvas
        camera={{
          position: cameraConfig.position,
          fov: cameraConfig.fov,
          near: 0.1,
          far: 10000,
        }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#f8fafc')
          gl.toneMapping = 0 // NoToneMapping
        }}
      >
        <Suspense fallback={null}>
          {children}
        </Suspense>
        <OrbitControls
          enabled={orbitEnabled}
          enableDamping={enableDamping}
          dampingFactor={0.1}
          minDistance={1}
          maxDistance={5000}
          maxPolarAngle={Math.PI * 0.85}
        />
      </Canvas>
    </div>
  )
}
