'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { MapPin, Search, Loader2 } from 'lucide-react'
import { CITY_PRESETS } from '@/lib/types/pipeline'
import type { SunlightConfigState } from '@/lib/types/sunlight'
import { useToast } from '@/contexts/ToastContext'

import WorkspacePanelSection from '../Workspace/WorkspacePanelSection'
import { decimalToDMS, dmsToDecimal } from '@/lib/utils/coordinate'

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
}

function getTimezone(lon: number): number {
  return Math.round(lon / 15) * 15
}

interface LocationConfigSectionProps {
  config: SunlightConfigState
  onConfigChange: (partial: Partial<SunlightConfigState>) => void
  disabled?: boolean
}

export default function LocationConfigSection({
  config,
  onConfigChange,
  disabled,
}: LocationConfigSectionProps) {
  const { showToast } = useToast()
  const [addressQuery, setAddressQuery] = useState('')
  const [addressResults, setAddressResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addressNoResults, setAddressNoResults] = useState(false)
  const [dmsMode, setDmsMode] = useState(false)
  const [latDMS, setLatDMS] = useState(() => decimalToDMS(config.latitude))
  const [lonDMS, setLonDMS] = useState(() => decimalToDMS(config.longitude))
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!dmsMode) {
      setLatDMS(decimalToDMS(config.latitude))
      setLonDMS(decimalToDMS(config.longitude))
    }
  }, [config.latitude, config.longitude, dmsMode])

  const handleLatDMSChange = useCallback((field: 'd' | 'm' | 's', value: number) => {
    const updated = { ...latDMS }
    if (field === 'd') updated.degrees = value
    else if (field === 'm') updated.minutes = value
    else updated.seconds = value
    setLatDMS(updated)
    const decimal = dmsToDecimal(updated.degrees, updated.minutes, updated.seconds)
    onConfigChange({ latitude: Math.round(decimal * 10000) / 10000 })
  }, [latDMS, onConfigChange])

  const handleLonDMSChange = useCallback((field: 'd' | 'm' | 's', value: number) => {
    const updated = { ...lonDMS }
    if (field === 'd') updated.degrees = value
    else if (field === 'm') updated.minutes = value
    else updated.seconds = value
    setLonDMS(updated)
    const decimal = dmsToDecimal(updated.degrees, updated.minutes, updated.seconds)
    onConfigChange({ longitude: Math.round(decimal * 10000) / 10000 })
  }, [lonDMS, onConfigChange])

  const searchAddress = useCallback((query: string) => {
    setAddressQuery(query)
    setAddressNoResults(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) {
      setAddressResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: NominatimResult[] = await res.json()
        setAddressResults(data)
        setAddressNoResults(data.length === 0)
      } catch {
        setAddressResults([])
        setAddressNoResults(false)
        showToast({ type: 'error', message: '주소 검색 중 오류가 발생하였습니다.' })
      } finally {
        setIsSearching(false)
      }
    }, 500)
  }, [showToast])

  const selectAddress = useCallback((result: NominatimResult) => {
    const lat = parseFloat(result.lat)
    const lon = parseFloat(result.lon)
    onConfigChange({
      latitude: Math.round(lat * 10000) / 10000,
      longitude: Math.round(lon * 10000) / 10000,
      timezone: getTimezone(lon),
    })
    setAddressQuery(result.display_name.split(',').slice(0, 3).join(', '))
    setAddressResults([])
  }, [onConfigChange])

  const dmsInputClass = `w-full border border-gray-200 px-1.5 py-1.5 text-xs tabular-nums
    focus:outline-none focus:border-red-600/30 disabled:opacity-50`

  return (
    <WorkspacePanelSection title="위치" icon={<MapPin size={14} />}>
      {/* Address search */}
      <div className="mb-3 relative">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={addressQuery}
            onChange={(e) => searchAddress(e.target.value)}
            placeholder="주소 검색..."
            disabled={disabled}
            className="w-full border border-gray-200 pl-8 pr-2.5 py-2 text-xs
              focus:outline-none focus:border-red-600/30 disabled:opacity-50
              placeholder:text-gray-400"
          />
        </div>
        {isSearching && (
          <span className="absolute right-2 top-2.5 text-[10px] text-gray-400">
            <Loader2 size={12} className="animate-spin" />
          </span>
        )}
        {addressResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-36 overflow-y-auto">
            {addressResults.map((result, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectAddress(result)}
                className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700
                  hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <p className="truncate">{result.display_name}</p>
              </button>
            ))}
          </div>
        )}
        {addressNoResults && !isSearching && addressQuery.length >= 2 && (
          <p className="text-[10px] text-gray-400 mt-1">
            검색 결과가 없습니다. 다른 키워드로 검색해보세요.
          </p>
        )}
      </div>

      {/* City presets */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {CITY_PRESETS.map((city, idx) => {
          const isActive =
            config.latitude === city.latitude && config.longitude === city.longitude
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onConfigChange({
                latitude: city.latitude,
                longitude: city.longitude,
                timezone: city.timezone,
              })}
              disabled={disabled}
              className={`rounded-full px-3 py-1 text-xs transition-all disabled:opacity-50 ${
                isActive
                  ? 'bg-red-600 text-white border border-red-600'
                  : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              {city.name.ko}
            </button>
          )
        })}
      </div>

      {/* DMS 토글 */}
      <div className="flex items-center justify-end mb-1.5">
        <button
          type="button"
          onClick={() => {
            setDmsMode(!dmsMode)
            if (!dmsMode) {
              setLatDMS(decimalToDMS(config.latitude))
              setLonDMS(decimalToDMS(config.longitude))
            }
          }}
          disabled={disabled}
          className={`px-2 py-0.5 text-[10px] border rounded transition-all ${
            dmsMode
              ? 'border-red-600 text-red-600 bg-red-50'
              : 'border-gray-200 text-gray-500 hover:border-red-600/30'
          }`}
        >
          {dmsMode ? '10진수' : 'DMS'}
        </button>
      </div>

      {/* Lat/Lon inputs */}
      {dmsMode ? (
        /* DMS 모드 */
        <div className="space-y-2 mb-2">
          <div>
            <label className="text-[10px] font-medium text-gray-500 block mb-1">위도 (DMS)</label>
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">도</label>
                <input
                  type="number"
                  value={latDMS.degrees}
                  onChange={(e) => handleLatDMSChange('d', Number(e.target.value))}
                  disabled={disabled}
                  className={dmsInputClass}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">분</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={latDMS.minutes}
                  onChange={(e) => handleLatDMSChange('m', Number(e.target.value))}
                  disabled={disabled}
                  className={dmsInputClass}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">초</label>
                <input
                  type="number"
                  min={0}
                  max={59.99}
                  step={0.01}
                  value={latDMS.seconds}
                  onChange={(e) => handleLatDMSChange('s', Number(e.target.value))}
                  disabled={disabled}
                  className={dmsInputClass}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-medium text-gray-500 block mb-1">경도 (DMS)</label>
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">도</label>
                <input
                  type="number"
                  value={lonDMS.degrees}
                  onChange={(e) => handleLonDMSChange('d', Number(e.target.value))}
                  disabled={disabled}
                  className={dmsInputClass}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">분</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={lonDMS.minutes}
                  onChange={(e) => handleLonDMSChange('m', Number(e.target.value))}
                  disabled={disabled}
                  className={dmsInputClass}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">초</label>
                <input
                  type="number"
                  min={0}
                  max={59.99}
                  step={0.01}
                  value={lonDMS.seconds}
                  onChange={(e) => handleLonDMSChange('s', Number(e.target.value))}
                  disabled={disabled}
                  className={dmsInputClass}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 10진수 모드 (기존) */
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-[10px] font-medium text-gray-500 block mb-1">위도</label>
            <input
              type="number"
              step="0.001"
              value={config.latitude}
              onChange={(e) => onConfigChange({ latitude: Number(e.target.value) })}
              disabled={disabled}
              className="w-full border border-gray-200 px-2 py-1.5 text-xs tabular-nums
                focus:outline-none focus:border-red-600/30 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-gray-500 block mb-1">경도</label>
            <input
              type="number"
              step="0.001"
              value={config.longitude}
              onChange={(e) => onConfigChange({ longitude: Number(e.target.value) })}
              disabled={disabled}
              className="w-full border border-gray-200 px-2 py-1.5 text-xs tabular-nums
                focus:outline-none focus:border-red-600/30 disabled:opacity-50"
            />
          </div>
        </div>
      )}

      {/* TZ / Azimuth */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-medium text-gray-500 block mb-1">자오선 (E)</label>
          <input
            type="number"
            step="1"
            value={config.timezone}
            onChange={(e) => onConfigChange({ timezone: Number(e.target.value) })}
            disabled={disabled}
            className="w-full border border-gray-200 px-2 py-1.5 text-xs tabular-nums
              focus:outline-none focus:border-red-600/30 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-gray-500 block mb-1">방위각 (W)</label>
          <input
            type="number"
            step="0.1"
            value={config.azimuth}
            onChange={(e) => onConfigChange({ azimuth: Number(e.target.value) })}
            disabled={disabled}
            className="w-full border border-gray-200 px-2 py-1.5 text-xs tabular-nums
              focus:outline-none focus:border-red-600/30 disabled:opacity-50"
            title="도면 Y축이 진북에서 서향으로 벗어난 각도"
          />
        </div>
      </div>
    </WorkspacePanelSection>
  )
}
