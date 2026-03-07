// 3D 뷰어 공유 타입 (M00)

import type * as THREE from 'three'

// ─── 모델 설정 ─────────────────────────────

export interface ModelConfig {
  url: string
  format: 'obj' | 'gltf' | 'glb'
  autoCenter?: boolean
  autoFitCamera?: boolean
  /** Z-up 좌표계 모델을 Y-up(Three.js)으로 회전. 기본값 true (Radiance/SketchUp OBJ) */
  zUp?: boolean
}

// ─── 바운딩 박스 ─────────────────────────────

export interface BoundingBox {
  min: [number, number, number]
  max: [number, number, number]
  center: [number, number, number]
  size: [number, number, number]
}

// ─── 카메라 프리셋 ─────────────────────────────

export type CameraPresetId = 'perspective' | 'top' | 'south' | 'north' | 'east' | 'west'

export interface CameraPreset {
  id: CameraPresetId
  label: { ko: string; en: string }
  position: [number, number, number]
  orthographic?: boolean
}

export const CAMERA_PRESETS: CameraPreset[] = [
  { id: 'perspective', label: { ko: '투시', en: 'Perspective' }, position: [1, 0.8, 1] },
  { id: 'top', label: { ko: '평면', en: 'Top' }, position: [0, 1, 0], orthographic: true },
  { id: 'south', label: { ko: '남측', en: 'South' }, position: [0, 0.3, 1] },
  { id: 'north', label: { ko: '북측', en: 'North' }, position: [0, 0.3, -1] },
  { id: 'east', label: { ko: '동측', en: 'East' }, position: [1, 0.3, 0] },
  { id: 'west', label: { ko: '서측', en: 'West' }, position: [-1, 0.3, 0] },
]

// ─── 모델 로딩 상태 ─────────────────────────────

export type ModelLoadState = 'idle' | 'loading' | 'loaded' | 'error'

export interface ModelLoadResult {
  state: ModelLoadState
  scene: THREE.Group | null
  bbox: BoundingBox | null
  error: string | null
}

// ─── 모델 메타데이터 (API 응답) ──────────────────

export interface ModelMetadata {
  model_id: string
  original_name: string
  format: string
  scene_url: string
  vertices: number
  faces: number
  bounds_min: [number, number, number]
  bounds_max: [number, number, number]
}

// ─── 복수 모델 지원 ─────────────────────────

export interface ModelEntry {
  id: string
  config: ModelConfig
  label?: string
}

export interface LoadedModel {
  id: string
  state: ModelLoadState
  scene: THREE.Group | null
  bbox: BoundingBox | null
  error: string | null
}

export interface MultiModelLoadResult {
  models: LoadedModel[]
  combinedBbox: BoundingBox | null
  isAllLoaded: boolean
}
