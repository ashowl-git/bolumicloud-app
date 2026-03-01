'use client'

import { useState, useCallback, useRef } from 'react'
import { MapPin, Eye, Grid3X3 } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { CITY_PRESETS } from '@/lib/types/pipeline'
import {
  HEMISPHERE_RESOLUTION_LABELS,
  PROJECTION_TYPE_LABELS,
} from '@/lib/types/view'
import type {
  ViewConfigState,
  HemisphereResolution,
  ProjectionType,
} from '@/lib/types/view'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  location: { ko: '위치', en: 'Location' } as LocalizedText,
  cityPreset: { ko: '도시 프리셋', en: 'City Preset' } as LocalizedText,
  latitude: { ko: '위도', en: 'Latitude' } as LocalizedText,
  longitude: { ko: '경도', en: 'Longitude' } as LocalizedText,
  resolution: { ko: '반구 해상도', en: 'Hemisphere Resolution' } as LocalizedText,
  projection: { ko: '투영 방식', en: 'Projection Type' } as LocalizedText,
  addressSearch: { ko: '주소 검색', en: 'Address Search' } as LocalizedText,
  addressPlaceholder: { ko: '주소 입력 (예: 서울시 강남구 역삼동)', en: 'Enter address' } as LocalizedText,
  searching: { ko: '검색 중...', en: 'Searching...' } as LocalizedText,
}

interface ViewConfigPanelProps {
  config: ViewConfigState
  onChange: (partial: Partial<ViewConfigState>) => void
  disabled?: boolean
}

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
}

function getTimezone(lon: number): number {
  return Math.round(lon / 15) * 15
}

export default function ViewConfigPanel({ config, onChange, disabled }: ViewConfigPanelProps) {
  const { t } = useLocalizedText()
  const [addressQuery, setAddressQuery] = useState('')
  const [addressResults, setAddressResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

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
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) {
      setAddressResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=ko`,
          { headers: { 'User-Agent': 'BoLumiCloud/1.0' } }
        )
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
  }, [onChange])

  return (
    <div className="space-y-6">
      {/* Location */}
      <div className="border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
          <MapPin size={16} strokeWidth={1.5} className="text-gray-500" />
          {t(txt.location)}
        </h3>

        <div className="mb-4 relative">
          <label className="text-xs text-gray-500 mb-1.5 block">{t(txt.addressSearch)}</label>
          <input
            type="text"
            value={addressQuery}
            onChange={(e) => searchAddress(e.target.value)}
            placeholder={t(txt.addressPlaceholder)}
            disabled={disabled}
            className="w-full border border-gray-200 px-3 py-2 text-sm
              focus:outline-none focus:border-red-600/30 disabled:opacity-50"
          />
          {isSearching && (
            <span className="absolute right-3 top-8 text-xs text-gray-400">{t(txt.searching)}</span>
          )}
          {addressResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto">
              {addressResults.map((result, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectAddress(result)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700
                    hover:bg-red-50 hover:text-red-600 transition-colors duration-300"
                >
                  <p className="truncate">{result.display_name}</p>
                  <p className="text-xs text-gray-400">
                    ({parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)})
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">{t(txt.latitude)}</label>
            <input
              type="number"
              step="0.001"
              value={config.latitude}
              onChange={(e) => onChange({ latitude: Number(e.target.value) })}
              disabled={disabled}
              className="w-full border border-gray-200 px-3 py-2 text-sm
                focus:outline-none focus:border-red-600/30 disabled:opacity-50"
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
                focus:outline-none focus:border-red-600/30 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Hemisphere Resolution */}
      <div className="border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Grid3X3 size={16} strokeWidth={1.5} className="text-gray-500" />
          {t(txt.resolution)}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(HEMISPHERE_RESOLUTION_LABELS) as [string, typeof HEMISPHERE_RESOLUTION_LABELS[90]][]).map(
            ([value, info]) => {
              const numValue = Number(value) as HemisphereResolution
              const isSelected = config.hemisphereResolution === numValue
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange({ hemisphereResolution: numValue })}
                  disabled={disabled}
                  className={`border p-3 text-left transition-all duration-300 disabled:opacity-50 ${
                    isSelected
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-red-600/30'
                  }`}
                >
                  <p className={`text-sm font-medium ${isSelected ? 'text-red-600' : 'text-gray-900'}`}>
                    {t(info)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{info.description}</p>
                </button>
              )
            }
          )}
        </div>
      </div>

      {/* Projection Type */}
      <div className="border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Eye size={16} strokeWidth={1.5} className="text-gray-500" />
          {t(txt.projection)}
        </h3>
        <div className="flex gap-4">
          {(Object.entries(PROJECTION_TYPE_LABELS) as [ProjectionType, { ko: string; en: string }][]).map(
            ([value, label]) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="projectionType"
                  value={value}
                  checked={config.projectionType === value}
                  onChange={() => onChange({ projectionType: value })}
                  disabled={disabled}
                  className="accent-red-600"
                />
                <span
                  className={`text-sm ${
                    config.projectionType === value ? 'text-red-600' : 'text-gray-700'
                  }`}
                >
                  {t(label)}
                </span>
              </label>
            )
          )}
        </div>
      </div>
    </div>
  )
}
