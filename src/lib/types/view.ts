// 조망 분석 (M02) 타입 정의

// ─── 반구 해상도 ─────────────────────────────

export type HemisphereResolution = 90 | 180 | 360 | 720

export const HEMISPHERE_RESOLUTION_LABELS: Record<HemisphereResolution, { ko: string; en: string; description: string }> = {
  90: { ko: '초안', en: 'Draft', description: '90px (1-2초)' },
  180: { ko: '표준', en: 'Standard', description: '180px (균형)' },
  360: { ko: '정밀', en: 'Precise', description: '360px (정밀)' },
  720: { ko: '최고', en: 'Ultra', description: '720px (최고 정밀)' },
}

// ─── 투영 방식 ─────────────────────────────

export type ProjectionType = 'equidistant' | 'equal_area' | 'equal_solid_angle'

export const PROJECTION_TYPE_LABELS: Record<ProjectionType, { ko: string; en: string }> = {
  equidistant: { ko: '등거리', en: 'Equidistant' },
  equal_area: { ko: '등면적', en: 'Equal Area' },
  equal_solid_angle: { ko: '등입체각', en: 'Equal Solid Angle' },
}

// ─── 관찰점 ─────────────────────────────

export interface ViewObserverPoint {
  id: string
  x: number
  y: number
  z: number
  name: string
  normal_dx?: number
  normal_dy?: number
  normal_dz?: number
}

// ─── 분석 설정 (프론트엔드 상태) ─────────────

export interface ViewConfigState {
  latitude: number
  longitude: number
  timezone: number
  hemisphereResolution: HemisphereResolution
  projectionType: ProjectionType
}

// ─── 분석 설정 (API 전송용) ─────────────────

export interface ViewConfig {
  latitude: number
  longitude: number
  hemisphere_resolution: number
  projection_type: string
  observer_points: ViewObserverPoint[]
  landscape_categories: Record<string, string>
}

// ─── 진행률 ─────────────────────────────

export interface ViewStage {
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  duration_sec: number | null
}

export interface ViewProgress {
  session_id: string
  status: 'uploaded' | 'processing' | 'completed' | 'error' | 'cancelled'
  stage: string | null
  stage_number: number
  stage_total: number
  stage_progress: {
    completed: number
    total: number
    current_item: string
  }
  overall_progress: number
  stages: ViewStage[]
  elapsed_sec: number
  error: string | null
}

// ─── 관찰점 결과 ─────────────────────────

export interface ObserverViewResult {
  id: string
  name: string
  coordinates: { x: number; y: number; z: number }
  svf: number
  view_openness: number
  view_by_category: Record<string, number>
  waldram_obstructions: WaldramObstruction[]
}

export interface WaldramObstruction {
  name: string
  points: Array<{ azimuth: number; altitude: number }>
}

// ─── 분석 결과 ─────────────────────────────

export interface ViewAnalysisResult {
  session_id: string
  projection_type: string
  hemisphere_resolution: number
  summary: ViewSummary
  observers: ObserverViewResult[]
  metadata: {
    triangle_count: number
    computation_time_sec: number
    rays_per_observer: number
    total_rays_cast: number
  }
}

export interface ViewSummary {
  total_observers: number
  average_svf: number
  average_openness: number
  min_svf: number
  max_svf: number
}

// ─── API 응답 ─────────────────────────────

export interface ViewUploadResponse {
  session_id: string
  message: string
  files: { obj: string }
}

export interface ViewRunResponse {
  message: string
  session_id: string
}

// ─── 스테이지 라벨 ─────────────────────────

export const VIEW_STAGE_LABELS: Record<string, { ko: string; en: string }> = {
  scene_assembly: { ko: '장면 구성', en: 'Scene Assembly' },
  observer_generation: { ko: '관찰점 생성', en: 'Observer Generation' },
  hemisphere_ray_casting: { ko: '반구 레이 캐스팅', en: 'Hemisphere Ray Casting' },
  group_aggregation: { ko: '그룹 집계', en: 'Group Aggregation' },
  visualization: { ko: '시각화 생성', en: 'Visualization' },
}
