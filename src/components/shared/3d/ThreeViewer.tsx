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
    if (!bbox) return { position: [20, 15, 20] as [number, number, number], fov: 50, near: 0.1, far: 10000 }

    const maxDim = Math.max(...bbox.size)
    const dist = maxDim * 1.8
    return {
      position: [bbox.center[0] + dist, bbox.center[1] + dist * 0.7, bbox.center[2] + dist] as [number, number, number],
      fov: 50,
      near: Math.max(0.1, maxDim * 0.001),
      far: Math.max(10000, maxDim * 10),
    }
  }, [bbox])

  if (!webglAvailable) return <WebGLFallback />

  // height="100%" 지원: wrapper가 부모 크기를 채우도록 설정
  const isFluid = height === '100%'

  return (
    <div
      className={`relative ${isFluid ? 'w-full h-full' : ''} ${className}`}
      style={isFluid ? { cursor: orbitEnabled ? 'grab' : 'crosshair' } : { height, cursor: orbitEnabled ? 'grab' : 'crosshair' }}
    >
      <Canvas
        camera={{
          position: cameraConfig.position,
          fov: cameraConfig.fov,
          near: cameraConfig.near,
          far: cameraConfig.far,
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
          minDistance={bbox ? Math.max(1, Math.max(...bbox.size) * 0.01) : 1}
          maxDistance={bbox ? Math.max(5000, Math.max(...bbox.size) * 5) : 5000}
          target={bbox ? [bbox.center[0], bbox.center[1], bbox.center[2]] : [0, 0, 0]}
          maxPolarAngle={Math.PI * 0.85}
        />
      </Canvas>
    </div>
  )
}
