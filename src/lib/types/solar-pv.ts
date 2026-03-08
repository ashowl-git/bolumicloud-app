// 태양광 발전량 분석 타입 정의

export type PVModulePreset =
  | 'generic_400w'
  | 'mono_perc_450w'
  | 'bifacial_550w'
  | 'hjt_600w'
  | 'topcon_580w'

export type LossProfile =
  | 'default'
  | 'optimistic'
  | 'conservative'
  | 'rooftop_residential'
  | 'utility_scale'

export type WeatherMode = 'clear_sky' | 'tmy'

export interface PVModulePresetInfo {
  id: PVModulePreset
  name: string
  pdc0_w: number
  efficiency: number
  area_m2: number
  bifaciality: number
  gamma_pdc: number
}

export interface SolarPVRunConfig {
  latitude: number
  longitude: number
  timezone_offset: number
  standard_meridian: number
  panel_layer_ids: string[]
  module_preset: PVModulePreset
  inverter_efficiency: number
  loss_profile: LossProfile
  ground_albedo: number
  degradation_rate: number
  weather_mode: WeatherMode
  excluded_groups: string[]
  economics_enabled: boolean
  electricity_price_krw: number
  install_cost_krw_per_kw: number
  lifetime_years: number
}

export interface PanelSurfaceInfo {
  surface_id: string
  center: [number, number, number]
  normal: [number, number, number]
  tilt_deg: number
  azimuth_deg: number
  area_m2: number
  face_indices: number[]
}

export interface ShadowCalendar {
  hours: number[]
  months: number[]
  matrix: number[][]
}

export interface OptimalOrientationInfo {
  optimal_tilt_deg: number
  optimal_azimuth_deg: number
  optimal_annual_kwh_m2: number
  actual_annual_kwh_m2: number
  orientation_loss_pct: number
}

export interface CO2ReductionResult {
  annual_co2_reduction_kg: number
  lifetime_co2_reduction_ton: number
  equivalent_trees: number
}

export interface AnnualCashflow {
  year: number
  generation_kwh: number
  savings_krw: number
  cumulative_savings_krw: number
  degraded_capacity_pct: number
}

export interface SurfacePVResult {
  surface_id: string
  center: [number, number, number]
  normal: [number, number, number]
  tilt_deg: number
  azimuth_deg: number
  area_m2: number
  annual_ghi_kwh_m2: number
  annual_poa_kwh_m2: number
  annual_effective_kwh_m2: number
  shadow_loss_pct: number
  annual_dc_kwh: number
  annual_ac_kwh: number
  monthly_kwh: number[] // length 12
  capacity_factor: number
  specific_yield_kwh_kwp: number
  n_modules: number
  capacity_kwp: number
  bifacial_gain_kwh: number
  performance_ratio: number
  surface_score: number
  shadow_calendar: ShadowCalendar | null
  optimal_orientation: OptimalOrientationInfo | null
}

export interface MonthlyTotal {
  month: number
  generation_kwh: number
  avg_shadow_loss_pct: number
}

export interface EconomicsResult {
  lcoe_krw_kwh: number
  simple_payback_years: number
  annual_savings_krw: number
  total_investment_krw: number
  npv_krw: number
  lifetime_generation_kwh: number
  co2_reduction: CO2ReductionResult | null
  annual_cashflow: AnnualCashflow[]
}

export interface SolarPVSummary {
  total_panel_area_m2: number
  total_capacity_kwp: number
  annual_generation_kwh: number
  specific_yield_kwh_kwp: number
  capacity_factor: number
  total_shadow_loss_pct: number
  best_surface_id: string | null
  worst_surface_id: string | null
  avg_performance_ratio: number
  total_bifacial_gain_kwh: number
}

export interface SolarPVResult {
  session_id: string
  location: {
    latitude: number
    longitude: number
    timezone_offset: number
    standard_meridian: number
  }
  pv_system: {
    module_preset: PVModulePreset
    inverter_efficiency: number
    loss_profile: LossProfile
    ground_albedo: number
    degradation_rate: number
  }
  summary: SolarPVSummary
  surfaces: SurfacePVResult[]
  monthly_totals: MonthlyTotal[]
  economics: EconomicsResult | null
  metadata: Record<string, unknown>
}

export interface SolarPVProgress {
  session_id: string
  status: string
  stage: string | null
  stage_number: number
  stage_total: number
  stage_progress: {
    completed: number
    total: number
    current_item: string
  }
  overall_progress: number
  stages: Array<{ name: string; status: string; duration_sec: number | null }>
  elapsed_sec: number
  error: string | null
}

export const DEFAULT_SOLAR_PV_CONFIG: SolarPVRunConfig = {
  latitude: 37.5665,
  longitude: 126.978,
  timezone_offset: 9,
  standard_meridian: 135,
  panel_layer_ids: [],
  module_preset: 'generic_400w',
  inverter_efficiency: 0.96,
  loss_profile: 'default',
  ground_albedo: 0.25,
  degradation_rate: 0.005,
  weather_mode: 'clear_sky',
  excluded_groups: [],
  economics_enabled: false,
  electricity_price_krw: 120,
  install_cost_krw_per_kw: 1_200_000,
  lifetime_years: 25,
}

export const MODULE_PRESET_LABELS: Record<PVModulePreset, string> = {
  generic_400w: 'Generic 400W',
  mono_perc_450w: 'Mono PERC 450W',
  bifacial_550w: 'Bifacial 550W',
  hjt_600w: 'HJT 600W',
  topcon_580w: 'TOPCon 580W',
}

export const LOSS_PROFILE_LABELS: Record<LossProfile, string> = {
  default: '기본',
  optimistic: '낙관적',
  conservative: '보수적',
  rooftop_residential: '주거용 옥상',
  utility_scale: '대규모 발전',
}

export const GROUND_ALBEDO_PRESETS: Record<string, { label: string; value: number }> = {
  concrete: { label: '콘크리트', value: 0.25 },
  grass: { label: '잔디', value: 0.20 },
  asphalt: { label: '아스팔트', value: 0.12 },
  snow: { label: '눈', value: 0.60 },
  white_roof: { label: '백색 지붕', value: 0.55 },
}
