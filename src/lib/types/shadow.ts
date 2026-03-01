// 그림자 시각화 타입 (Phase 2)

// ─── 그림자 프레임 ─────────────────────────────

export interface ShadowPolygon {
  building_id: string
  coordinates: [number, number][]  // (x_east, y_north) 꼭짓점 배열
}

export interface ShadowFrame {
  minute: number                 // 0-479 (08:00=0, 16:00=479)
  time: string                   // "12:30"
  polygons: ShadowPolygon[]
  solar_altitude: number         // 도
  solar_azimuth: number          // 도 (N=0, 시계방향)
}

export interface ShadowComputeResponse {
  shadow_id: string
  total_frames: number
  time_start: string
  time_end: string
  step_minutes: number
}

// ─── 재생 상태 ─────────────────────────────

export type PlaybackSpeed = 1 | 2 | 5

export interface PlaybackState {
  currentMinute: number          // 0-479
  isPlaying: boolean
  speed: PlaybackSpeed
}

// ─── 태양 위치 ─────────────────────────────

export interface SolarPosition {
  altitude: number               // 도
  azimuth: number                // 도 (N=0)
}

// ─── 시간 유틸 ─────────────────────────────

export function minuteToTime(minute: number): string {
  const totalMin = 480 + minute  // 08:00 = 480분
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function timeToMinute(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m - 480  // 08:00 기준
}

export const SHADOW_TIME_RANGE = {
  startHour: 8,
  endHour: 16,
  totalMinutes: 480,
} as const
