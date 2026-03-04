import { SUNLIGHT_DATE_PRESETS, DEFAULT_TOTAL_THRESHOLD, DEFAULT_CONTINUOUS_THRESHOLD } from '@/lib/types/sunlight'
import type { SunlightConfigState } from '@/lib/types/sunlight'

export const DEFAULT_SUNLIGHT_CONFIG: SunlightConfigState = {
  latitude: 37.5665,
  longitude: 126.978,
  timezone: 135,
  azimuth: 0,
  date: SUNLIGHT_DATE_PRESETS[0],
  buildingType: 'apartment',
  resolution: 'legal',
  solarTimeMode: 'true_solar',
  totalThreshold: { ...DEFAULT_TOTAL_THRESHOLD },
  continuousThreshold: { ...DEFAULT_CONTINUOUS_THRESHOLD },
}
