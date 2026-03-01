// 주택성능등급 (M05) 타입 정의

import type { LocalizedText } from './i18n'

// ─── 단지 정보 ─────────────────────────────

export interface ComplexInfo {
  name: string
  address: string
  totalUnits: number
  constructionCompany: string
  designFirm: string
  siteArea: number
  buildingCoverage: number
  floorAreaRatio: number
  latitude: number
  longitude: number
}

// ─── 건물 ─────────────────────────────

export interface PerformanceBuilding {
  id: string
  name: string
  stories: number
  height: number
  orientation: number
}

// ─── 세대 ─────────────────────────────

export interface HousingUnit {
  id: string
  buildingId: string
  unitType: string
  floor: number
  area: number
  livingRoomArea: number
  windowArea: number
  windowTransmittance: number
  facingBuildingId: string
  separationDistance: number | null
  daylightFactor: number | null
}

// ─── 등급 입력 ─────────────────────────────

export interface GradeInput {
  grade: 1 | 2 | 3 | 4
  method: 'auto' | 'manual'
  evidence: string
  notes: string
  calculatedValue: number | null
}

export interface PerformanceGrades {
  noise_bathroom: GradeInput
  noise_heavyweight: GradeInput
  noise_lightweight: GradeInput
  noise_wall: GradeInput
  struct_adaptability: GradeInput
  struct_durability: GradeInput
  struct_private: GradeInput
  struct_public: GradeInput
  env_living: GradeInput
  env_nature: GradeInput
  fire_evacuation: GradeInput
  fire_resistance: GradeInput
  fire_detection: GradeInput
  mgmt_private: GradeInput
  mgmt_public: GradeInput
  energy: GradeInput
}

// ─── 등급 항목 메타데이터 ─────────────────────

export type GradeDomain = '소음' | '구조' | '환경' | '화재' | '관리' | '에너지'

export interface GradeItemMeta {
  id: keyof PerformanceGrades
  name: LocalizedText
  domain: GradeDomain
  unit: string
  criteria: { grade1: string; grade2: string; grade3: string; grade4: string }
}

export const GRADE_ITEMS: GradeItemMeta[] = [
  { id: 'noise_bathroom', name: { ko: '욕실 배수 소음', en: 'Bathroom Drainage' }, domain: '소음', unit: 'dB(A)', criteria: { grade1: '<=38', grade2: '<=41', grade3: '<=44', grade4: '>44' } },
  { id: 'noise_heavyweight', name: { ko: '중량충격음 차단', en: 'Heavyweight Impact' }, domain: '소음', unit: 'dB', criteria: { grade1: '<=40', grade2: '<=43', grade3: '<=47', grade4: '>47' } },
  { id: 'noise_lightweight', name: { ko: '경량충격음 차단', en: 'Lightweight Impact' }, domain: '소음', unit: 'dB', criteria: { grade1: '<=43', grade2: '<=48', grade3: '<=53', grade4: '>53' } },
  { id: 'noise_wall', name: { ko: '벽체 차음', en: 'Wall Insulation' }, domain: '소음', unit: 'dB', criteria: { grade1: '>=55', grade2: '>=50', grade3: '>=45', grade4: '<45' } },
  { id: 'struct_adaptability', name: { ko: '가변성', en: 'Adaptability' }, domain: '구조', unit: '', criteria: { grade1: '강화', grade2: '표준', grade3: '부분', grade4: '고정' } },
  { id: 'struct_durability', name: { ko: '내구성', en: 'Durability' }, domain: '구조', unit: '년', criteria: { grade1: '>=65', grade2: '>=50', grade3: '>=30', grade4: '<30' } },
  { id: 'struct_private', name: { ko: '전용공간', en: 'Private Space' }, domain: '구조', unit: '', criteria: { grade1: '강화 BF', grade2: 'BF 충족', grade3: '부분 충족', grade4: '최소' } },
  { id: 'struct_public', name: { ko: '공용공간', en: 'Public Space' }, domain: '구조', unit: '', criteria: { grade1: '강화 접근', grade2: '접근 충족', grade3: '부분 충족', grade4: '최소' } },
  { id: 'env_living', name: { ko: '생활환경', en: 'Living Environment' }, domain: '환경', unit: '%', criteria: { grade1: 'DF>=2.5 or R>=1.5', grade2: 'DF>=2.0 or R>=1.25', grade3: 'DF>=1.5 or R>=1.0', grade4: 'DF<1.5' } },
  { id: 'env_nature', name: { ko: '자연환경', en: 'Natural Environment' }, domain: '환경', unit: '%', criteria: { grade1: '>=40%', grade2: '>=35%', grade3: '>=30%', grade4: '<30%' } },
  { id: 'fire_evacuation', name: { ko: '피난설비', en: 'Evacuation' }, domain: '화재', unit: '', criteria: { grade1: '강화+발코니', grade2: '강화+2계단', grade3: '표준+2계단', grade4: '최소' } },
  { id: 'fire_resistance', name: { ko: '내화성능', en: 'Fire Resistance' }, domain: '화재', unit: '시간', criteria: { grade1: '2시간+', grade2: '1시간+', grade3: '법규', grade4: '최소' } },
  { id: 'fire_detection', name: { ko: '감지설비', en: 'Detection' }, domain: '화재', unit: '', criteria: { grade1: '주소형+스프+제연', grade2: '주소형+스프', grade3: '표준+스프', grade4: '최소' } },
  { id: 'mgmt_private', name: { ko: '사적관리', en: 'Private Mgmt' }, domain: '관리', unit: '', criteria: { grade1: '스마트홈+원격+CCTV', grade2: '원격+CCTV', grade3: '표준', grade4: '최소' } },
  { id: 'mgmt_public', name: { ko: '공적관리', en: 'Public Mgmt' }, domain: '관리', unit: '', criteria: { grade1: 'BAS+예측', grade2: 'BAS+정기', grade3: '표준', grade4: '최소' } },
  { id: 'energy', name: { ko: '에너지성능', en: 'Energy Performance' }, domain: '에너지', unit: '등급', criteria: { grade1: '1++이상', grade2: '1+등급', grade3: '1등급', grade4: '2등급' } },
]

export const GRADE_DOMAINS: { domain: GradeDomain; label: LocalizedText; color: string }[] = [
  { domain: '소음', label: { ko: '소음', en: 'Noise' }, color: '#8b5cf6' },
  { domain: '구조', label: { ko: '구조', en: 'Structure' }, color: '#3b82f6' },
  { domain: '환경', label: { ko: '환경', en: 'Environment' }, color: '#22c55e' },
  { domain: '화재', label: { ko: '화재', en: 'Fire' }, color: '#ef4444' },
  { domain: '관리', label: { ko: '관리', en: 'Management' }, color: '#f59e0b' },
  { domain: '에너지', label: { ko: '에너지', en: 'Energy' }, color: '#06b6d4' },
]

// ─── 인동거리 결과 ─────────────────────────────

export interface SeparationResult {
  from_building_id: string
  from_building_name: string
  to_building_id: string
  to_building_name: string
  distance: number
  to_height: number
  ratio: number
  required_ratio: number
  compliant: boolean
}

// ─── 세대별 채광률 결과 ─────────────────────────

export interface UnitDaylightResult {
  unit_id: string
  building_name: string
  floor: number
  unit_type: string
  window_area: number
  window_transmittance: number
  daylight_factor: number
  separation_distance: number
  separation_ratio: number
  grade: number
}

// ─── 등급 카테고리 결과 ─────────────────────────

export interface GradeCategory {
  id: string
  name: string
  domain: string
  grade: number
  method: string
  calculated_value: number | null
  unit: string
}

// ─── 전체 산출 결과 ─────────────────────────────

export interface PerformanceResult {
  project_id: string
  categories: GradeCategory[]
  grade_distribution: {
    grade1: number
    grade2: number
    grade3: number
    grade4: number
  }
  separation_table: SeparationResult[]
  unit_daylight_table: UnitDaylightResult[]
  average_daylight_factor: number
  minimum_daylight_factor: number
  living_environment_grade: number
}

// ─── 등급 색상 유틸 ─────────────────────────────

export const GRADE_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-green-50', text: 'text-green-600', label: '1등급 (우수)' },
  2: { bg: 'bg-blue-50', text: 'text-blue-600', label: '2등급 (양호)' },
  3: { bg: 'bg-amber-50', text: 'text-amber-600', label: '3등급 (보통)' },
  4: { bg: 'bg-red-50', text: 'text-red-600', label: '4등급 (미달)' },
}
