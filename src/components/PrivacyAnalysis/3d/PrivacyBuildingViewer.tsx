'use client'

import * as THREE from 'three'
import dynamic from 'next/dynamic'
import type { BoundingBox } from '@/components/shared/3d/types'
import type { SurfaceHit } from '@/components/shared/3d/interaction/types'
import type { WindowSpec } from '@/lib/types/privacy'

const ThreeViewer = dynamic(() => import('@/components/shared/3d/ThreeViewer'), { ssr: false })
const InteractiveBuildingModel = dynamic(() => import('@/components/shared/3d/interaction/InteractiveBuildingModel'), { ssr: false })
const SurfaceHighlight = dynamic(() => import('@/components/shared/3d/interaction/SurfaceHighlight'), { ssr: false })
const GroundGrid = dynamic(() => import('@/components/shared/3d/GroundGrid'), { ssr: false })
const CompassRose = dynamic(() => import('@/components/shared/3d/CompassRose'), { ssr: false })
const SceneLighting = dynamic(() => import('@/components/shared/3d/SceneLighting'), { ssr: false })
const WindowMarkers = dynamic(() => import('./WindowMarkers'), { ssr: false })

// ─── PrivacyBuildingViewer ─────────────────────────
// 두 건물을 동시에 렌더링. activeRole에 따라 하나만 인터랙션 활성화.

interface PrivacyBuildingViewerProps {
  targetScene: THREE.Group | null
  observerScene: THREE.Group | null
  targetBbox: BoundingBox | null
  observerBbox: BoundingBox | null
  activeRole: 'target' | 'observer'
  interactionEnabled: boolean
  hoverHit: SurfaceHit | null
  onSurfaceHover: (hit: SurfaceHit | null) => void
  onSurfaceClick: (hit: SurfaceHit) => void
  orbitEnabled: boolean
  // 창문 마커
  targetWindows: WindowSpec[]
  observerWindows: WindowSpec[]
  selectedWindowId: string | null
  onWindowClick: (id: string) => void
}

export default function PrivacyBuildingViewer({
  targetScene,
  observerScene,
  targetBbox,
  observerBbox,
  activeRole,
  interactionEnabled,
  hoverHit,
  onSurfaceHover,
  onSurfaceClick,
  orbitEnabled,
  targetWindows,
  observerWindows,
  selectedWindowId,
  onWindowClick,
}: PrivacyBuildingViewerProps) {
  // 두 건물의 bbox를 합쳐서 카메라 설정
  const combinedBbox = mergeBbox(targetBbox, observerBbox)

  return (
    <ThreeViewer
      bbox={combinedBbox}
      height="450px"
      orbitEnabled={orbitEnabled}
    >
      <SceneLighting />

      {/* 대상 건물 (orange) */}
      {targetScene && (
        <InteractiveBuildingModel
          scene={targetScene}
          bbox={targetBbox}
          color="#f97316"
          opacity={0.6}
          showWireframe
          autoFitCamera={!observerScene}
          interactionEnabled={interactionEnabled && activeRole === 'target'}
          allowedSurfaces={['wall']}
          onSurfaceHover={activeRole === 'target' ? onSurfaceHover : undefined}
          onSurfaceClick={activeRole === 'target' ? onSurfaceClick : undefined}
          highlightColor="#fb923c"
        />
      )}

      {/* 관찰 건물 (blue) */}
      {observerScene && (
        <InteractiveBuildingModel
          scene={observerScene}
          bbox={observerBbox}
          color="#3b82f6"
          opacity={0.6}
          showWireframe
          autoFitCamera={false}
          interactionEnabled={interactionEnabled && activeRole === 'observer'}
          allowedSurfaces={['wall']}
          onSurfaceHover={activeRole === 'observer' ? onSurfaceHover : undefined}
          onSurfaceClick={activeRole === 'observer' ? onSurfaceClick : undefined}
          highlightColor="#60a5fa"
        />
      )}

      <GroundGrid bbox={combinedBbox} />
      <CompassRose bbox={combinedBbox} />
      <SurfaceHighlight hit={hoverHit} />

      {/* 배치된 창문 마커 */}
      <WindowMarkers
        targetWindows={targetWindows}
        observerWindows={observerWindows}
        selectedWindowId={selectedWindowId}
        onWindowClick={onWindowClick}
      />
    </ThreeViewer>
  )
}

// ─── bbox 합치기 유틸 ─────────────────────────────

function mergeBbox(a: BoundingBox | null, b: BoundingBox | null): BoundingBox | null {
  if (!a && !b) return null
  if (!a) return b
  if (!b) return a

  const min: [number, number, number] = [
    Math.min(a.min[0], b.min[0]),
    Math.min(a.min[1], b.min[1]),
    Math.min(a.min[2], b.min[2]),
  ]
  const max: [number, number, number] = [
    Math.max(a.max[0], b.max[0]),
    Math.max(a.max[1], b.max[1]),
    Math.max(a.max[2], b.max[2]),
  ]
  const center: [number, number, number] = [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2,
  ]
  const size: [number, number, number] = [
    max[0] - min[0],
    max[1] - min[1],
    max[2] - min[2],
  ]

  return { min, max, center, size }
}
