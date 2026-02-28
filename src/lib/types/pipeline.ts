// SketchUp-to-Radiance 파이프라인 타입 정의

// V2: Multi-date support
export interface AnalysisDate {
  month: number
  day: number
  label: string  // "춘분", "하지", "추분", "동지", "custom"
}

export const DATE_PRESETS: AnalysisDate[] = [
  { month: 3,  day: 20, label: '춘분' },
  { month: 6,  day: 21, label: '하지' },
  { month: 9,  day: 22, label: '추분' },
  { month: 12, day: 21, label: '동지' },
]

export const MAX_RENDERS = 800

export interface PipelineConfig {
  latitude: number       // 양수 (동경)
  longitude: number      // 양수 (동경) — 백엔드 호출 시 음수 변환
  timezone: number       // 양수 (예: 135) — 백엔드 호출 시 음수 변환
  dates: AnalysisDate[]  // V2: 복수 날짜
  hours: number[]        // [6, 7, 8, ..., 18]
  xres: number           // 기본 500
  yres: number           // 기본 500
  quality: 'low' | 'medium' | 'high'
  skyType: 'sunny_with_sun' | 'cloudy' | 'intermediate'
}

export interface PipelineStage {
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  duration_sec: number | null
}

export interface PipelineStageProgress {
  completed: number
  total: number
  current_item: string
}

export interface PipelineProgress {
  session_id: string
  status: 'uploaded' | 'processing' | 'completed' | 'error'
  stage: string | null
  stage_number: number
  stage_total: number
  stage_progress: PipelineStageProgress
  overall_progress: number
  stages: PipelineStage[]
  elapsed_sec: number
  error: string | null
}

export interface PipelineUploadResponse {
  session_id: string
  message: string
  vf_count: number
  files: {
    vf: string[]
    obj: string
    mtl?: string
  }
}

export interface PipelineRunResponse {
  message: string
  session_id: string
}

export interface PipelineInfo {
  session_id: string
  total_duration_sec: number
  quality: string
  resolution: string
  renders: number
  stages: PipelineStage[]
}

// City presets for quick location setup
export interface CityPreset {
  name: { ko: string; en: string }
  latitude: number
  longitude: number
  timezone: number
}

// Render time estimates (seconds per render)
export const RENDER_TIME_ESTIMATES: Record<'low' | 'medium' | 'high', number> = {
  low: 30,
  medium: 120,
  high: 480,
}

export const QUALITY_DETAILS: Record<'low' | 'medium' | 'high', { resolution: number; ab: number }> = {
  low:    { resolution: 500,  ab: 2 },
  medium: { resolution: 1000, ab: 3 },
  high:   { resolution: 2000, ab: 4 },
}

export const CITY_PRESETS: CityPreset[] = [
  { name: { ko: '서울', en: 'Seoul' }, latitude: 37.5665, longitude: 126.978, timezone: 135 },
  { name: { ko: '부산', en: 'Busan' }, latitude: 35.1796, longitude: 129.0756, timezone: 135 },
  { name: { ko: '인천', en: 'Incheon' }, latitude: 37.4563, longitude: 126.7052, timezone: 135 },
  { name: { ko: '도쿄', en: 'Tokyo' }, latitude: 35.6762, longitude: 139.6503, timezone: 135 },
  { name: { ko: '베이징', en: 'Beijing' }, latitude: 39.9042, longitude: 116.4074, timezone: 120 },
]
