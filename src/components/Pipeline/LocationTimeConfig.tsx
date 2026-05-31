'use client'

import { useState, useCallback, useRef, useId } from 'react'
import { MapPin, Calendar, Clock, Sun, Cloud, CloudSun } from 'lucide-react'
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
  addressSearch: { ko: '주소 검색', en: 'Address Search' } as LocalizedText,
  addressPlaceholder: { ko: '주소 입력 (예: 서울시 강남구 역삼동)', en: 'Enter address (e.g., Gangnam-gu Seoul)' } as LocalizedText,
  searching: { ko: '검색 중...', en: 'Searching...' } as LocalizedText,
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

const SKY_OPTIONS: { value: 'sunny_with_sun' | 'cloudy' | 'intermediate'; label: LocalizedText; icon: typeof Sun }[] = [
  { value: 'sunny_with_sun', label: txt.sunny, icon: Sun },
  { value: 'cloudy', label: txt.cloudy, icon: Cloud },
  { value: 'intermediate', label: txt.intermediate, icon: CloudSun },
]

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
}

function getTimezone(lon: number): number {
  // 경도 기반 표준시 자오선 계산 (15도 단위)
  return Math.round(lon / 15) * 15
}

export default function LocationTimeConfig({ config, onChange, vfCount, disabled }: LocationTimeConfigProps) {
  const { t } = useLocalizedText()
  const [addressQuery, setAddressQuery] = useState('')
  const [addressResults, setAddressResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeResultIdx, setActiveResultIdx] = useState(-1)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const addressInputId = useId()
  const latId = useId()
  const lonId = useId()
  const tzId = useId()

  const handleCityPreset = useCallback(
    (idx: number) => {
      const city = CITY_PRESETS[idx]
      if (city) {
        onChange({
          latitude: city.latitude,
          longitude: city.longitude,
          timezone: city.timezone,
        })
        setAddressQuery('')
        setAddressResults([])
      }
    },
    [onChange]
  )

  const searchAddress = useCallback((query: string) => {
    setAddressQuery(query)
    setActiveResultIdx(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) {
      setAddressResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
        const data: NominatimResult[] = await res.json()
        setAddressResults(data)
      } catch {
        setAddressResults([])
      } finally {
        setIsSearching(false)
      }
    }, 400)
  }, [])

  const selectAddress = useCallback((result: NominatimResult) => {
    const lat = parseFloat(result.lat)
    const lon = parseFloat(result.lon)
    onChange({
      latitude: Math.round(lat * 10000) / 10000,
      longitude: Math.round(lon * 10000) / 10000,
      timezone: getTimezone(lon),
    })
    setAddressQuery(result.display_name.split(',').slice(0, 3).join(', '))
    setAddressResults([])
    setActiveResultIdx(-1)
  }, [onChange])

  const handleAddressKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (addressResults.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveResultIdx((prev) => Math.min(prev + 1, addressResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveResultIdx((prev) => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter' && activeResultIdx >= 0) {
      e.preventDefault()
      selectAddress(addressResults[activeResultIdx])
    } else if (e.key === 'Escape') {
      setAddressResults([])
      setActiveResultIdx(-1)
    }
  }, [addressResults, activeResultIdx, selectAddress])

  const listboxId = `${addressInputId}-listbox`

  return (
    <div className="space-y-6">
      {/* Location */}
      <fieldset className="border border-gray-200 p-6">
        <legend className="text-sm font-medium text-gray-900 flex items-center gap-2 px-1">
          <MapPin size={16} strokeWidth={1.5} className="text-gray-500" />
          {t(txt.location)}
        </legend>

        {/* Address Search */}
        <div className="mb-4 relative">
          <label htmlFor={addressInputId} className="text-xs text-gray-500 mb-1.5 block">
            {t(txt.addressSearch)}
          </label>
          <div className="flex gap-2">
            <input
              id={addressInputId}
              type="text"
              value={addressQuery}
              onChange={(e) => searchAddress(e.target.value)}
              onKeyDown={handleAddressKeyDown}
              placeholder={t(txt.addressPlaceholder)}
              disabled={disabled}
              role="combobox"
              aria-expanded={addressResults.length > 0}
              aria-controls={listboxId}
              aria-activedescendant={activeResultIdx >= 0 ? `${listboxId}-opt-${activeResultIdx}` : undefined}
              aria-autocomplete="list"
              className="flex-1 border border-gray-200 px-3 py-2 text-sm
                focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 disabled:opacity-50"
            />
            {isSearching && (
              <span className="self-center text-xs text-gray-400" aria-live="polite">{t(txt.searching)}</span>
            )}
          </div>
          {/* Search results dropdown */}
          {addressResults.length > 0 && (
            <ul
              id={listboxId}
              role="listbox"
              aria-label={t(txt.addressSearch)}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto"
            >
              {addressResults.map((result, idx) => (
                <li
                  key={idx}
                  id={`${listboxId}-opt-${idx}`}
                  role="option"
                  aria-selected={idx === activeResultIdx}
                >
                  <button
                    type="button"
                    onClick={() => selectAddress(result)}
                    className={`w-full text-left px-3 py-2 text-sm text-gray-700
                      hover:bg-red-50 hover:text-red-600 transition-colors duration-300
                      border-b border-gray-50 last:border-0
                      focus:outline-2 focus:outline-offset-[-2px] focus:outline-blue-500
                      ${idx === activeResultIdx ? 'bg-red-50 text-red-600' : ''}`}
                  >
                    <p className="truncate">{result.display_name}</p>
                    <p className="text-xs text-gray-400">
                      ({parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)})
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4">
          <span className="text-xs text-gray-500 mb-2 block">{t(txt.cityPreset)}</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t(txt.cityPreset)}>
            {CITY_PRESETS.map((city, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleCityPreset(idx)}
                disabled={disabled}
                aria-label={t(city.name)}
                className="border border-gray-200 hover:border-red-600/30 px-3 py-1.5
                  text-sm text-gray-700 hover:text-red-600 transition-all duration-300
                  disabled:opacity-50
                  focus:outline-2 focus:outline-offset-2 focus:outline-blue-500"
              >
                {t(city.name)}
              </button>
            ))}
          </div>
        </div>

        <fieldset className="border-0 p-0 m-0">
          <legend className="sr-only">{t(txt.location)} 좌표</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor={latId} className="text-xs text-gray-500 mb-1 block">{t(txt.latitude)}</label>
              <input
                id={latId}
                type="number"
                step="0.001"
                value={config.latitude}
                onChange={(e) => onChange({ latitude: Number(e.target.value) })}
                disabled={disabled}
                className="w-full border border-gray-200 px-3 py-2 text-sm
                  focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor={lonId} className="text-xs text-gray-500 mb-1 block">{t(txt.longitude)}</label>
              <input
                id={lonId}
                type="number"
                step="0.001"
                value={config.longitude}
                onChange={(e) => onChange({ longitude: Number(e.target.value) })}
                disabled={disabled}
                className="w-full border border-gray-200 px-3 py-2 text-sm
                  focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor={tzId} className="text-xs text-gray-500 mb-1 block">{t(txt.timezone)}</label>
              <input
                id={tzId}
                type="number"
                step="1"
                value={config.timezone}
                onChange={(e) => onChange({ timezone: Number(e.target.value) })}
                disabled={disabled}
                className="w-full border border-gray-200 px-3 py-2 text-sm
                  focus:outline-2 focus:outline-offset-2 focus:outline-blue-500 disabled:opacity-50"
              />
            </div>
          </div>
        </fieldset>
      </fieldset>

      {/* Dates */}
      <div className="border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Calendar size={16} strokeWidth={1.5} className="text-gray-500" />
          {t(txt.dates)}
        </h3>
        <DateSelector
          selectedDates={config.dates}
          onChange={(dates) => onChange({ dates })}
          disabled={disabled}
        />
      </div>

      {/* Hours */}
      <div className="border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={16} strokeWidth={1.5} className="text-gray-500" />
          {t(txt.hours)}
        </h3>
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
      <fieldset className="border border-gray-200 p-6">
        <legend className="text-sm font-medium text-gray-900">{t(txt.sky)}</legend>
        <div className="flex gap-4 mt-4">
          {SKY_OPTIONS.map((opt) => {
            const SkyIcon = opt.icon
            return (
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
                <SkyIcon size={16} strokeWidth={1.5} className={config.skyType === opt.value ? 'text-red-600' : 'text-gray-500'} />
                <span className={`text-sm ${config.skyType === opt.value ? 'text-red-600' : 'text-gray-700'}`}>
                  {t(opt.label)}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
