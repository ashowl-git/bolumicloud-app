// 사생활 분석 (M03) 타입 정의

import type { LocalizedText } from './i18n'

// ─── 창문 사양 ─────────────────────────────

export interface WindowSpec {
  id: string
  x: number
  y: number
  z: number
  normal_dx: number
  normal_dy: number
  normal_dz: number
  width: number
  height: number
  building_name: string
  floor: number
}

// ─── 분석 설정 (프론트엔드 상태) ─────────────

export interface PrivacyConfigState {
  distanceThreshold: number
  subGridResolution: SubGridResolution
  piiThreshold: number
  observerWindows: WindowSpec[]
  targetWindows: WindowSpec[]
}

export type SubGridResolution = 3 | 5 | 9 | 16

export const SUB_GRID_LABELS: Record<SubGridResolution, { ko: string; en: string; description: string }> = {
  3: { ko: '빠름', en: 'Fast', description: '3x3 (9 samples)' },
  5: { ko: '표준', en: 'Standard', description: '5x5 (25 samples)' },
  9: { ko: '정밀', en: 'Precise', description: '9x9 (81 samples)' },
  16: { ko: '최고', en: 'Ultra', description: '16x16 (256 samples)' },
}

// ─── 분석 설정 (API 페이로드) ─────────────

export interface PrivacyConfig {
  distance_threshold: number
  sub_grid_resolution: number
  pii_threshold: number
  observer_windows: WindowSpec[]
  target_windows: WindowSpec[]
}

// ─── 진행률 ─────────────────────────────

export type PrivacyStage =
  | 'scene_assembly'
  | 'pair_generation'
  | 'line_of_sight_analysis'
  | 'aggregation'
  | 'visualization'

export const PRIVACY_STAGE_LABELS: Record<PrivacyStage, LocalizedText> = {
  scene_assembly: { ko: '장면 구성', en: 'Scene Assembly' },
  pair_generation: { ko: '분석 쌍 생성', en: 'Pair Generation' },
  line_of_sight_analysis: { ko: '가시성 분석', en: 'Line-of-Sight Analysis' },
  aggregation: { ko: '집계 및 판정', en: 'Aggregation' },
  visualization: { ko: '시각화 생성', en: 'Visualization' },
}

export interface PrivacyProgress {
  session_id: string
  status: string
  stage: PrivacyStage | null
  stage_number: number
  stage_total: number
  stage_progress: { completed: number; total: number; current_item: string }
  overall_progress: number
  stages: { name: string; status: string; duration_sec: number | null }[]
  elapsed_sec: number
  error: string | null
}

// ─── 분석 결과 ─────────────────────────────

export interface PairResult {
  id: number
  observer: {
    id: string
    coordinates: { x: number; y: number; z: number }
    normal: { dx: number; dy: number; dz: number }
    building_name: string
    floor: number
  }
  target: {
    id: string
    coordinates: { x: number; y: number; z: number }
    normal: { dx: number; dy: number; dz: number }
    width: number
    height: number
    building_name: string
    floor: number
  }
  distance: number
  observer_viewing_angle: number
  target_incidence_angle: number
  vpq: number
  visibility_factor: number
  angle_factor: number
  distance_factor: number
  pii: number
  infringed: boolean
  grade: number
  grade_label: string
  severity: number
  line_of_sight_blocked: boolean
}

export interface TargetWindowSummary {
  id: string
  coordinates: { x: number; y: number; z: number }
  worst_case_pii: number
  worst_case_observer_id: string
  infringed: boolean
  observer_count: number
}

export interface PrivacySummary {
  total_pairs_analyzed: number
  infringed_pairs: number
  infringement_rate: number
  max_severity: number
  average_severity: number
  closest_distance: number
  average_distance: number
  pii_threshold_used: number
  grade_distribution: {
    severe: number
    caution: number
    good: number
  }
}

export interface PrivacyAnalysisResult {
  session_id: string
  summary: PrivacySummary
  pairs: PairResult[]
  target_windows: TargetWindowSummary[]
  metadata: {
    triangle_count: number
    computation_time_sec: number
    target_windows_count: number
    observer_windows_count: number
    total_rays_cast: number
  }
}

// ─── 3D 시각화용 타입 ─────────────────────────
export interface WindowPosition3D {
  id: string
  position: [number, number, number]  // [x, y, z]
  normal: [number, number, number]    // [dx, dy, dz]
  width: number
  height: number
  buildingName: string
  floor: number
}
