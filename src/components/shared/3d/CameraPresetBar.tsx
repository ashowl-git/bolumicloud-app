'use client'

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Maximize2 } from 'lucide-react'
import * as THREE from 'three'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { CAMERA_PRESETS, type CameraPresetId, type BoundingBox } from './types'

const PRESET_ICONS: Record<CameraPresetId, typeof Eye> = {
  perspective: Eye,
  top: Maximize2,
  south: ArrowUp,
  north: ArrowDown,
  east: ArrowRight,
  west: ArrowLeft,
}

// ─── HTML 오버레이 (Canvas 외부) ─────────────────

interface CameraPresetBarProps {
  bbox: BoundingBox | null
  activePreset?: CameraPresetId
  onPresetChange?: (id: CameraPresetId) => void
}

export default function CameraPresetBar({
  activePreset = 'perspective',
  onPresetChange,
}: CameraPresetBarProps) {
  const { t } = useLocalizedText()

  return (
    <div className="absolute top-3 left-3 flex gap-0.5
      bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg rounded-lg px-1.5 py-1 z-20">
      {CAMERA_PRESETS.map((preset) => {
        const Icon = PRESET_ICONS[preset.id]
        const isActive = activePreset === preset.id
        return (
          <button
            key={preset.id}
            onClick={() => onPresetChange?.(preset.id)}
            title={t(preset.label)}
            aria-label={`${t(preset.label)} 카메라 프리셋`}
            aria-pressed={isActive}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] rounded
              transition-all duration-200 ${
              isActive
                ? 'bg-gray-900 text-white font-medium'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <Icon size={12} strokeWidth={isActive ? 2 : 1.5} />
            <span className="hidden sm:inline">{t(preset.label)}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── 카메라 이동 유틸 ─────────────────────────

export function applyCameraPreset(
  camera: THREE.Camera,
  presetId: CameraPresetId,
  bbox: BoundingBox | null,
  controls?: { target: THREE.Vector3; update: () => void },
): void {
  const preset = CAMERA_PRESETS.find((p) => p.id === presetId)
  if (!preset) return

  const dist = bbox ? Math.max(...bbox.size) * 2 : 50
  const [dx, dy, dz] = preset.position

  const lookTarget = new THREE.Vector3(0, bbox ? bbox.size[1] * 0.3 : 0, 0)

  camera.position.set(dx * dist, dy * dist, dz * dist)
  camera.lookAt(lookTarget)

  if (camera instanceof THREE.PerspectiveCamera) {
    camera.updateProjectionMatrix()
  }

  if (controls) {
    controls.target.copy(lookTarget)
    controls.update()
  }
}

// ─── R3F 내부 컴포넌트 (Canvas 안에서 사용) ─────────

export function CameraPresetApplier({
  presetId,
  trigger,
  bbox,
}: {
  presetId: CameraPresetId
  trigger: number
  bbox: BoundingBox | null
}) {
  const { camera, controls, invalidate } = useThree()

  useEffect(() => {
    if (trigger === 0) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyCameraPreset(camera, presetId, bbox, controls as any)
    invalidate()
  }, [trigger]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
