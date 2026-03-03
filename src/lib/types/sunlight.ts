// 일조 분석 (Track B) 타입 정의

import type { AnalysisDate } from './pipeline'

// ─── 건축물 유형 ─────────────────────────────

export type BuildingType = 'apartment' | 'detached' | 'other'

export const BUILDING_TYPE_LABELS: Record<BuildingType, { ko: string; en: string }> = {
  apartment: { ko: '공동주택 (아파트)', en: 'Apartment' },
  detached: { ko: '단독/다세대', en: 'Detached/Multi-family' },
  other: { ko: '기타', en: 'Other' },
}

// ─── 분석 해상도 ─────────────────────────────

export type AnalysisResolution = 'preview' | 'standard' | 'legal'

export const RESOLUTION_LABELS: Record<AnalysisResolution, { ko: string; en: string; minutes: number; description: string }> = {
  preview: { ko: '미리보기', en: 'Preview', minutes: 10, description: '10분 간격 (3-5초)' },
  standard: { ko: '표준', en: 'Standard', minutes: 5, description: '5분 간격 (균형)' },
  legal: { ko: '법규', en: 'Legal', minutes: 1, description: '1분 간격 (정밀)' },
}

// ─── 분석 설정 ─────────────────────────────

export interface SunlightConfig {
  latitude: number
  longitude: number
  timezone_offset: number
  standard_meridian: number
  azimuth: number               // 방위각 (W 양수)
  month: number
  day: number
  date_label: string
  building_type: BuildingType
  time_start: string            // 총일조 시작 (e.g. "08:00")
  time_end: string              // 총일조 끝 (e.g. "16:00")
  continuous_start: string      // 연속일조 시작 (e.g. "09:00")
  continuous_end: string        // 연속일조 끝 (e.g. "15:00")
  total_required_hours: number  // 총일조 수인한도 (시간)
  continuous_required_hours: number  // 연속일조 수인한도 (시간)
  resolution: AnalysisResolution
  solar_time_mode: SolarTimeMode
  measurement_points: MeasurementPoint[]
}

export interface MeasurementPoint {
  id: string
  x: number
  y: number
  z: number
  name: string
  group?: string    // 측정점 그룹명 (e.g., "101동")
  row?: number      // 행 (층 기준, 1부터)
  column?: number   // 열 (호 기준, 1부터)
}

// ─── 측정점 그룹 (동별 관리) ──────────────

export interface MeasurementPointGroup {
  id: string
  name: string               // e.g., "101동", "기본"
  points: MeasurementPoint[]
  /** 자동 정렬 완료 여부 */
  sorted: boolean
  /** 열 순서 반전 (Sanalyst "열의 순서를 반대로 바꿈") */
  reverseColumns: boolean
}

// ─── 기준시 ─────────────────────────────
export type SolarTimeMode = 'true_solar' | 'local_standard'

export const SOLAR_TIME_MODE_LABELS: Record<SolarTimeMode, { ko: string; en: string }> = {
  true_solar: { ko: '진태양시', en: 'True Solar Time' },
  local_standard: { ko: '지방표준시', en: 'Local Standard Time' },
}

// ─── 총일조/연속일조 수인한도 설정 ──────────

export interface SunlightThreshold {
  startHour: number   // 시작 시각 (0-23)
  endHour: number     // 끝 시각 (0-23)
  requiredHours: number  // 수인한도 (시간)
}

export const DEFAULT_TOTAL_THRESHOLD: SunlightThreshold = {
  startHour: 8,
  endHour: 16,
  requiredHours: 4,
}

export const DEFAULT_CONTINUOUS_THRESHOLD: SunlightThreshold = {
  startHour: 9,
  endHour: 15,
  requiredHours: 2,
}

// ─── 프론트엔드 설정 상태 (UI 레벨) ──────────

export interface SunlightConfigState {
  latitude: number
  longitude: number
  timezone: number
  azimuth: number  // 방위각 (도면 Y축 기준, 서향 양수)
  date: AnalysisDate
  buildingType: BuildingType
  resolution: AnalysisResolution
  solarTimeMode: SolarTimeMode
  totalThreshold: SunlightThreshold      // 총일조시간 수인한도
  continuousThreshold: SunlightThreshold  // 연속일조시간 수인한도
}

// ─── 분석 진행률 ─────────────────────────────

export interface SunlightStage {
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  duration_sec: number | null
}

export interface SunlightProgress {
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
  stages: SunlightStage[]
  elapsed_sec: number
  error: string | null
}

// ─── 분석 결과 ─────────────────────────────

export interface PointSunlightResult {
  id: string
  x: number
  y: number
  z: number
  name: string
  total_hours: number
  continuous_hours: number
  hourly_status: number[]  // 1=일조, 0=그림자, -1=야간
  compliant: boolean
}

export interface SunlightSummary {
  total_points: number
  compliant_points: number
  compliance_rate: number
  building_type: BuildingType
  regulation_reference: string
}

export interface SunlightAnalysisResult {
  session_id: string
  analysis_date: AnalysisDate
  location: {
    latitude: number
    longitude: number
    timezone_offset: number
    standard_meridian: number
  }
  building_type: BuildingType
  time_window: {
    start: string
    end: string
    step_minutes: number
  }
  summary: SunlightSummary
  points: PointSunlightResult[]
  metadata: {
    computation_time_sec: number
    triangle_count: number
    sun_positions_computed: number
    resolution: string
  }
}

// ─── 원인 분석 (Phase 4) ─────────────────────────

export interface BlockerInfo {
  building_id: string
  shadow_minutes: number
  shadow_percentage: number
  bbox_min: [number, number, number]
  bbox_max: [number, number, number]
}

export interface PointCauseResult {
  point_id: string
  point_name: string
  compliant: boolean
  total_hours: number
  continuous_hours: number
  blockers: BlockerInfo[]
}

export interface BuildingInfo {
  building_id: string
  height: number
  bbox_min: [number, number, number]
  bbox_max: [number, number, number]
}

export interface CauseAnalysisResult {
  buildings: BuildingInfo[]
  point_causes: PointCauseResult[]
  total_non_compliant: number
}

// ─── 3D 모델 메타데이터 ─────────────────────────

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

// ─── API 응답 ─────────────────────────────

export interface SunlightUploadResponse {
  session_id: string
  message: string
  files: { obj: string }
}

export interface SunlightRunResponse {
  message: string
  session_id: string
}

// ─── 스테이지 라벨 ─────────────────────────

export const SUNLIGHT_STAGE_LABELS: Record<string, { ko: string; en: string }> = {
  model_load: { ko: '3D 모델 로드', en: '3D Model Loading' },
  measurement_points: { ko: '측정점 설정', en: 'Measurement Points Setup' },
  integration: { ko: '일조 시간 적분', en: 'Sunlight Integration' },
  compliance: { ko: '법규 판정', en: 'Compliance Check' },
}

// ─── SN5F 임포트 데이터 ─────────────────────────

export interface BuildingGroupInfo {
  name: string                    // 그룹/레이어명 (e.g., "101동")
  vertexCount: number
  faceCount: number
  color?: string                  // Hex color assigned by frontend
  visible: boolean
}

export interface Sn5fConditions {
  azimuth: number
  month: number
  day: number
  latitude: number
  longitude: number
  standardMeridian: number
  solarTimeMode: SolarTimeMode
  continuousStart?: number
  continuousEnd?: number
  continuousThresholdHour?: number
  continuousThresholdMin?: number
  totalStart?: number
  totalEnd?: number
  totalThresholdHour?: number
  totalThresholdMin?: number
}

export interface Sn5fMeasurementGroup {
  groupName: string
  points: {
    id: string
    x: number
    y: number
    z: number
    name: string
    lightTimes?: { intervals: [number, number][] }[]
  }[]
}

export interface Sn5fImportData {
  sessionId: string
  modelId: string
  sceneUrl: string
  groups: BuildingGroupInfo[]
  conditions: Sn5fConditions | null
  measurementGroups: Sn5fMeasurementGroup[]
  layers: { name: string; layerType: number; visible: boolean; parentName: string }[]
}

// ─── 지반일조 분석 결과 ─────────────────────────

export interface GridCell {
  x: number
  y: number
  total_hours: number
  continuous_hours: number
}

export interface GroundAnalysisResult {
  grid_data: GridCell[]
  grid_size: number
  bounds: {
    min: [number, number]
    max: [number, number]
  }
  metadata: {
    point_count: number
    resolution: string
  }
}

// ─── 등시간선 / 일영곡선 ─────────────────────────

export type ContourLineType = 'total' | 'continuous' | 'shadow'

export interface IsochroneLine {
  level: number
  type: ContourLineType
  coordinates: [number, number][]
}

export interface ShadowContourLine extends IsochroneLine {
  type: 'shadow'
  time: string   // e.g. "10:30"
}

// ─── 레이어 관리 ─────────────────────────

export interface LayerConfig {
  id: string
  name: string           // e.g., "101동", "기존건물"
  visible: boolean
  isAnalysisTarget: boolean  // 분석 대상 여부
  color: string          // Hex color
  vertexCount?: number
  faceCount?: number
}

// ─── 날짜 프리셋 (일조 분석용) ────────────────

export const SUNLIGHT_DATE_PRESETS: AnalysisDate[] = [
  { month: 12, day: 21, label: '동지' },  // 법규 기준일
  { month: 3, day: 20, label: '춘분' },
  { month: 6, day: 21, label: '하지' },
  { month: 9, day: 22, label: '추분' },
]
