'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import type { ShadowFrame, PlaybackState } from '@/lib/types/shadow'
import type { BoundingBox } from '@/components/shared/3d/types'

const ThreeViewer = dynamic(() => import('@/components/shared/3d/ThreeViewer'), { ssr: false })
const BuildingModel = dynamic(() => import('@/components/shared/3d/BuildingModel'), { ssr: false })
const GroundGrid = dynamic(() => import('@/components/shared/3d/GroundGrid'), { ssr: false })
const CompassRose = dynamic(() => import('@/components/shared/3d/CompassRose'), { ssr: false })
const SceneLighting = dynamic(() => import('@/components/shared/3d/SceneLighting'), { ssr: false })
const ShadowOverlay = dynamic(() => import('./ShadowOverlay'), { ssr: false })
const SunPositionIndicator = dynamic(() => import('./SunPositionIndicator'), { ssr: false })

import TimeSlider from './TimeSlider'
import type * as THREE from 'three'

// ─── ShadowAnimationPlayer ─────────────────────

interface ShadowAnimationPlayerProps {
  modelScene: THREE.Group | null
  modelBbox: BoundingBox | null
  currentFrame: ShadowFrame | null
  playback: PlaybackState
  maxMinute: number
  stepSize: number
  onMinuteChange: (minute: number) => void
  onPlay: () => void
  onPause: () => void
  onSpeedChange: (speed: 1 | 2 | 5) => void
  children?: ReactNode
}

export default function ShadowAnimationPlayer({
  modelScene,
  modelBbox,
  currentFrame,
  playback,
  maxMinute,
  stepSize,
  onMinuteChange,
  onPlay,
  onPause,
  onSpeedChange,
  children,
}: ShadowAnimationPlayerProps) {
  // 태양 방향 -> SceneLighting의 directional light 방향
  const sunDirection = useMemo((): [number, number, number] => {
    if (!currentFrame || currentFrame.solar_altitude <= 0) {
      return [50, 80, 30]
    }

    const altRad = (currentFrame.solar_altitude * Math.PI) / 180
    const aziRad = (currentFrame.solar_azimuth * Math.PI) / 180

    const x = Math.cos(altRad) * Math.sin(aziRad) * 100
    const y = Math.sin(altRad) * 100
    const z = Math.cos(altRad) * Math.cos(aziRad) * 100

    return [x, y, z]
  }, [currentFrame])

  const solarPosition = currentFrame
    ? { altitude: currentFrame.solar_altitude, azimuth: currentFrame.solar_azimuth }
    : null

  return (
    <div className="space-y-0">
      {/* 3D 뷰어 */}
      <div className="border border-gray-200 border-b-0 relative">
        <ThreeViewer bbox={modelBbox} height="450px">
          <SceneLighting sunDirection={sunDirection} />
          {modelScene && (
            <BuildingModel scene={modelScene} bbox={modelBbox} autoFitCamera={false} />
          )}
          <ShadowOverlay frame={currentFrame} />
          <SunPositionIndicator solarPosition={solarPosition} />
          <GroundGrid bbox={modelBbox} />
          <CompassRose bbox={modelBbox} />
          {children}
        </ThreeViewer>
      </div>

      {/* 타임 슬라이더 */}
      <TimeSlider
        playback={playback}
        maxMinute={maxMinute}
        stepSize={stepSize}
        onMinuteChange={onMinuteChange}
        onPlay={onPlay}
        onPause={onPause}
        onSpeedChange={onSpeedChange}
      />
    </div>
  )
}
