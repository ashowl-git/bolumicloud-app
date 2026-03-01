'use client'

import * as THREE from 'three'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { CAMERA_PRESETS, type CameraPresetId, type BoundingBox } from './types'

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
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 bg-white/90 border border-gray-200 px-1 py-1 z-10">
      {CAMERA_PRESETS.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onPresetChange?.(preset.id)}
          className={`px-3 py-1.5 text-xs transition-all duration-200 ${
            activePreset === preset.id
              ? 'text-red-600 font-medium border-b-2 border-red-600'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {t(preset.label)}
        </button>
      ))}
    </div>
  )
}

// ─── 카메라 이동 유틸 ─────────────────────────

export function applyCameraPreset(
  camera: THREE.Camera,
  presetId: CameraPresetId,
  bbox: BoundingBox | null,
): void {
  const preset = CAMERA_PRESETS.find((p) => p.id === presetId)
  if (!preset) return

  const dist = bbox ? Math.max(...bbox.size) * 2 : 50
  const [dx, dy, dz] = preset.position

  camera.position.set(dx * dist, dy * dist, dz * dist)

  const lookY = bbox ? bbox.size[1] * 0.3 : 0
  camera.lookAt(0, lookY, 0)

  if (camera instanceof THREE.PerspectiveCamera) {
    camera.updateProjectionMatrix()
  }
}
