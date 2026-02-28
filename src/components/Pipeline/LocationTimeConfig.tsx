'use client'

import { useCallback } from 'react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { CITY_PRESETS } from '@/lib/types/pipeline'
import type { AnalysisDate } from '@/lib/types/pipeline'
import HourChipSelector from './HourChipSelector'
import DateSelector from './DateSelector'
import RenderCountBadge from './RenderCountBadge'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  location: { ko: '위치', en: 'Location' } as LocalizedText,
  cityPreset: { ko: '도시 프리셋', en: 'City Preset' } as LocalizedText,
  latitude: { ko: '위도', en: 'Latitude' } as LocalizedText,
  longitude: { ko: '경도 (동경)', en: 'Longitude (East)' } as LocalizedText,
  timezone: { ko: '자오선 (동경)', en: 'Meridian (East)' } as LocalizedText,
  dates: { ko: '분석 날짜', en: 'Analysis Dates' } as LocalizedText,
  hours: { ko: '분석 시간', en: 'Analysis Hours' } as LocalizedText,
  sky: { ko: '하늘 유형', en: 'Sky Type' } as LocalizedText,
  sunny: { ko: '맑음+태양', en: 'Sunny+Sun' } as LocalizedText,
  cloudy: { ko: '흐림', en: 'Cloudy' } as LocalizedText,
  intermediate: { ko: '중간', en: 'Intermediate' } as LocalizedText,
  renderCount: { ko: '렌더 수 확인', en: 'Render Count' } as LocalizedText,
}

export interface LocationTimeConfigState {
  latitude: number
  longitude: number
  timezone: number
  dates: AnalysisDate[]
  selectedHours: number[]
  skyType: 'sunny_with_sun' | 'cloudy' | 'intermediate'
}

interface LocationTimeConfigProps {
  config: LocationTimeConfigState
  onChange: (partial: Partial<LocationTimeConfigState>) => void
  vfCount: number
  disabled?: boolean
}

const SKY_OPTIONS: { value: 'sunny_with_sun' | 'cloudy' | 'intermediate'; label: LocalizedText }[] = [
  { value: 'sunny_with_sun', label: txt.sunny },
  { value: 'cloudy', label: txt.cloudy },
  { value: 'intermediate', label: txt.intermediate },
]

export default function LocationTimeConfig({ config, onChange, vfCount, disabled }: LocationTimeConfigProps) {
  const { t } = useLocalizedText()

  const handleCityPreset = useCallback(
    (idx: number) => {
      const city = CITY_PRESETS[idx]
      if (city) {
        onChange({
          latitude: city.latitude,
          longitude: city.longitude,
          timezone: city.timezone,
        })
      }
    },
    [onChange]
  )

  return (
    <div className="space-y-6">
      {/* Location */}
      <div className="border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">{t(txt.location)}</h3>

        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-2 block">{t(txt.cityPreset)}</label>
          <div className="flex flex-wrap gap-2">
            {CITY_PRESETS.map((city, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleCityPreset(idx)}
                disabled={disabled}
                className="border border-gray-200 hover:border-red-600/30 px-3 py-1.5
                  text-sm text-gray-700 hover:text-red-600 transition-all duration-300
                  disabled:opacity-50"
              >
                {t(city.name)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t(txt.latitude)}</label>
            <input
              type="number"
              step="0.001"
              value={config.latitude}
              onChange={(e) => onChange({ latitude: Number(e.target.value) })}
              disabled={disabled}
              className="w-full border border-gray-200 px-3 py-2 text-sm
                focus:outline-none focus:border-gray-400 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t(txt.longitude)}</label>
            <input
              type="number"
              step="0.001"
              value={config.longitude}
              onChange={(e) => onChange({ longitude: Number(e.target.value) })}
              disabled={disabled}
              className="w-full border border-gray-200 px-3 py-2 text-sm
                focus:outline-none focus:border-gray-400 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t(txt.timezone)}</label>
            <input
              type="number"
              step="1"
              value={config.timezone}
              onChange={(e) => onChange({ timezone: Number(e.target.value) })}
              disabled={disabled}
              className="w-full border border-gray-200 px-3 py-2 text-sm
                focus:outline-none focus:border-gray-400 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">{t(txt.dates)}</h3>
        <DateSelector
          selectedDates={config.dates}
          onChange={(dates) => onChange({ dates })}
          disabled={disabled}
        />
      </div>

      {/* Hours */}
      <div className="border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">{t(txt.hours)}</h3>
        <HourChipSelector
          selectedHours={config.selectedHours}
          onChange={(hours) => onChange({ selectedHours: hours })}
          disabled={disabled}
        />
      </div>

      {/* Render Count Badge */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">{t(txt.renderCount)}</h3>
        <RenderCountBadge
          vfCount={vfCount}
          dateCount={config.dates.length}
          hourCount={config.selectedHours.length}
        />
      </div>

      {/* Sky Type */}
      <div className="border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">{t(txt.sky)}</h3>
        <div className="flex gap-4">
          {SKY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="skyType"
                value={opt.value}
                checked={config.skyType === opt.value}
                onChange={() => onChange({ skyType: opt.value })}
                disabled={disabled}
                className="accent-red-600"
              />
              <span className={`text-sm ${config.skyType === opt.value ? 'text-red-600' : 'text-gray-700'}`}>
                {t(opt.label)}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
