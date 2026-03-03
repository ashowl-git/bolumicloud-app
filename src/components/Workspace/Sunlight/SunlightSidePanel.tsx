'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  MapPin, Calendar, Clock, List, BarChart3, FileSpreadsheet, Search,
  Crosshair, Loader2, X, ArrowUpDown, ArrowRightLeft, FolderPlus,
  Save, RotateCcw, Grid3X3, Sparkles,
} from 'lucide-react'
import { CITY_PRESETS } from '@/lib/types/pipeline'
import {
  BUILDING_TYPE_LABELS,
  RESOLUTION_LABELS,
  SUNLIGHT_DATE_PRESETS,
  SOLAR_TIME_MODE_LABELS,
} from '@/lib/types/sunlight'
import type {
  SunlightConfigState,
  SunlightAnalysisResult,
  CauseAnalysisResult,
  BuildingType,
  AnalysisResolution,
  SolarTimeMode,
  LayerConfig,
} from '@/lib/types/sunlight'
import type { BaseAnalysisPoint } from '@/components/shared/3d/interaction/types'
import type { MeasurementPointGroup } from '@/lib/types/sunlight'

import WorkspaceSidePanel from '../WorkspaceSidePanel'
import WorkspacePanelSection from '../WorkspacePanelSection'
import SunlightResultsTable from '@/components/SunlightAnalysis/SunlightResultsTable'
import SunlightComplianceSummary from '@/components/SunlightAnalysis/SunlightComplianceSummary'
import SunlightHourlyChart from '@/components/SunlightAnalysis/SunlightHourlyChart'
import CauseAnalysisView from '@/components/SunlightAnalysis/CauseAnalysisView'
import OptimizationPanel from '@/components/SunlightAnalysis/OptimizationPanel'
import LayerPanel from './LayerPanel'

// ─── DMS 변환 유틸리티 ─────────────────────
function decimalToDMS(decimal: number): { degrees: number; minutes: number; seconds: number } {
  const d = Math.floor(Math.abs(decimal))
  const m = Math.floor((Math.abs(decimal) - d) * 60)
  const s = ((Math.abs(decimal) - d) * 60 - m) * 60
  return { degrees: decimal >= 0 ? d : -d, minutes: m, seconds: Math.round(s * 100) / 100 }
}

function dmsToDecimal(d: number, m: number, s: number): number {
  const sign = d >= 0 ? 1 : -1
  return sign * (Math.abs(d) + m / 60 + s / 3600)
}

// ─── localStorage 키 ─────────────────────
const DEFAULTS_STORAGE_KEY = 'bolumicloud-sunlight-defaults'

// ─── Address search types ─────────────────────
interface NominatimResult {
  display_name: string
  lat: string
  lon: string
}

function getTimezone(lon: number): number {
  return Math.round(lon / 15) * 15
}

// ─── Props ─────────────────────────────────────
interface SunlightSidePanelProps {
  open: boolean
  onClose: () => void
  onOpen: () => void
  // Config
  config: SunlightConfigState
  onConfigChange: (partial: Partial<SunlightConfigState>) => void
  disabled?: boolean
  // Points
  points: BaseAnalysisPoint[]
  selectedPointId?: string | null
  onPointSelect?: (id: string) => void
  // Point Groups
  groups: MeasurementPointGroup[]
  activeGroupId: string | null
  onAddGroup: (name: string) => void
  onRemoveGroup: (groupId: string) => void
  onRenameGroup: (groupId: string, name: string) => void
  onSetActiveGroup: (groupId: string) => void
  onSortGroup: (groupId: string) => void
  onToggleReverseColumns: (groupId: string) => void
  // Analysis
  isRunning: boolean
  onStartAnalysis: () => void
  // Results
  results: SunlightAnalysisResult | null
  // Report
  onGenerateReport?: () => void
  reportDownloadUrl?: string | null
  isGeneratingReport?: boolean
  // Cause analysis
  causeResult: CauseAnalysisResult | null
  selectedBuildingId: string | null
  onBuildingSelect: (id: string | null) => void
  // Ground analysis
  gridInterval?: number
  onGridIntervalChange?: (interval: number) => void
  onStartGroundAnalysis?: () => void
  isGroundAnalysisRunning?: boolean
  // Optimization
  apiUrl?: string
  sessionId?: string | null
  // Layer management
  layers?: LayerConfig[]
  onToggleLayerVisibility?: (layerId: string) => void
  onToggleAnalysisTarget?: (layerId: string) => void
  onToggleAllLayers?: (visible: boolean) => void
}

export default function SunlightSidePanel({
  open,
  onClose,
  onOpen,
  config,
  onConfigChange,
  disabled,
  points,
  selectedPointId,
  onPointSelect,
  groups,
  activeGroupId,
  onAddGroup,
  onRemoveGroup,
  onRenameGroup,
  onSetActiveGroup,
  onSortGroup,
  onToggleReverseColumns,
  isRunning,
  onStartAnalysis,
  results,
  onGenerateReport,
  reportDownloadUrl,
  isGeneratingReport,
  causeResult,
  selectedBuildingId,
  onBuildingSelect,
  gridInterval = 2.0,
  onGridIntervalChange,
  onStartGroundAnalysis,
  isGroundAnalysisRunning = false,
  apiUrl = '',
  sessionId = null,
  layers = [],
  onToggleLayerVisibility,
  onToggleAnalysisTarget,
  onToggleAllLayers,
}: SunlightSidePanelProps) {
  // Address search state
  const [addressQuery, setAddressQuery] = useState('')
  const [addressResults, setAddressResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // DMS 모드 토글
  const [dmsMode, setDmsMode] = useState(false)
  const [latDMS, setLatDMS] = useState(() => decimalToDMS(config.latitude))
  const [lonDMS, setLonDMS] = useState(() => decimalToDMS(config.longitude))

  // 기본값 저장 상태
  const [hasSavedDefaults, setHasSavedDefaults] = useState(false)

  // 초기 로드: localStorage에서 저장된 기본값 확인
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DEFAULTS_STORAGE_KEY)
      if (saved) {
        setHasSavedDefaults(true)
        const defaults = JSON.parse(saved) as Partial<SunlightConfigState>
        onConfigChange(defaults)
      }
    } catch {
      // localStorage 접근 실패 무시
    }
    // 마운트 시 1회만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // config의 lat/lon이 외부에서 변경되면 DMS도 동기화
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

  const saveDefaults = useCallback(() => {
    try {
      localStorage.setItem(DEFAULTS_STORAGE_KEY, JSON.stringify(config))
      setHasSavedDefaults(true)
    } catch {
      // localStorage 접근 실패 무시
    }
  }, [config])

  const clearDefaults = useCallback(() => {
    try {
      localStorage.removeItem(DEFAULTS_STORAGE_KEY)
      setHasSavedDefaults(false)
    } catch {
      // localStorage 접근 실패 무시
    }
  }, [])

  const searchAddress = useCallback((query: string) => {
    setAddressQuery(query)
    if (query.length < 2) {
      setAddressResults([])
      return
    }
    const timer = setTimeout(async () => {
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
    return () => clearTimeout(timer)
  }, [])

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

  const selectedPoint = selectedPointId
    ? results?.points.find((p) => p.id === selectedPointId) ?? null
    : null

  const noPoints = points.length === 0
  const footerDisabled = isRunning || disabled || noPoints

  const footer = (
    <div className="space-y-1.5">
      <button
        onClick={onStartAnalysis}
        disabled={footerDisabled}
        className="w-full flex items-center justify-center gap-2 border border-gray-200
          hover:border-red-600/30 py-2.5 text-sm text-gray-900 hover:text-red-600
          transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed
          disabled:hover:border-gray-200 disabled:hover:text-gray-900"
      >
        {isRunning && <Loader2 size={14} className="animate-spin" />}
        {isRunning ? '분석 중...' : results ? '재분석' : '분석 시작'}
      </button>
      {results && !isRunning && (
        <p className="text-[10px] text-gray-400 text-center">
          측정점을 수정한 후 재분석할 수 있습니다
        </p>
      )}
      {noPoints && !isRunning && !results && (
        <p className="text-[10px] text-gray-400 text-center">
          측정점을 먼저 배치하세요
        </p>
      )}
    </div>
  )

  const dmsInputClass = `w-full border border-gray-200 px-1.5 py-1.5 text-xs tabular-nums
    focus:outline-none focus:border-red-600/30 disabled:opacity-50`

  return (
    <WorkspaceSidePanel
      title="일조 분석"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      footer={footer}
    >
      {/* ── 위치 설정 ── */}
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

      {/* ── 날짜/해상도 ── */}
      <WorkspacePanelSection title="날짜 / 해상도" icon={<Calendar size={14} />}>
        {/* Date presets */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {SUNLIGHT_DATE_PRESETS.map((preset) => {
            const isSelected = config.date.month === preset.month && config.date.day === preset.day
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onConfigChange({ date: preset })}
                disabled={disabled}
                className={`border px-2.5 py-1 text-xs transition-all disabled:opacity-50 ${
                  isSelected
                    ? 'border-red-600 text-red-600 bg-red-50'
                    : 'border-gray-200 text-gray-700 hover:border-red-600/30'
                }`}
              >
                {preset.label} ({preset.month}/{preset.day})
              </button>
            )
          })}
        </div>

        {/* Building type */}
        <div className="mb-3">
          <label className="text-[10px] font-medium text-gray-500 block mb-1.5">건축물 유형</label>
          <div className="flex gap-3">
            {(Object.entries(BUILDING_TYPE_LABELS) as [BuildingType, { ko: string; en: string }][]).map(
              ([value, label]) => (
                <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="buildingType"
                    value={value}
                    checked={config.buildingType === value}
                    onChange={() => onConfigChange({ buildingType: value })}
                    disabled={disabled}
                    className="accent-red-600 w-3 h-3"
                  />
                  <span className={`text-xs ${config.buildingType === value ? 'text-red-600' : 'text-gray-700'}`}>
                    {label.ko}
                  </span>
                </label>
              )
            )}
          </div>
        </div>

        {/* Resolution */}
        <div className="mb-3">
          <label className="text-[10px] font-medium text-gray-500 block mb-1.5">분석 해상도</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.entries(RESOLUTION_LABELS) as [AnalysisResolution, typeof RESOLUTION_LABELS['legal']][]).map(
              ([value, info]) => {
                const isSelected = config.resolution === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onConfigChange({ resolution: value })}
                    disabled={disabled}
                    className={`border p-2 text-left transition-all disabled:opacity-50 rounded ${
                      isSelected
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-200 hover:border-red-600/30'
                    }`}
                  >
                    <p className={`text-xs font-medium ${isSelected ? 'text-red-600' : 'text-gray-900'}`}>
                      {info.ko}
                    </p>
                  </button>
                )
              }
            )}
          </div>
        </div>

        {/* Solar time mode */}
        <div className="mb-3">
          <label className="text-[10px] font-medium text-gray-500 block mb-1.5">기준시</label>
          <div className="flex gap-1.5">
            {(Object.entries(SOLAR_TIME_MODE_LABELS) as [SolarTimeMode, { ko: string }][]).map(
              ([value, label]) => {
                const isSelected = config.solarTimeMode === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onConfigChange({ solarTimeMode: value })}
                    disabled={disabled}
                    className={`flex-1 py-1.5 text-xs text-center transition-all rounded disabled:opacity-50 ${
                      isSelected
                        ? 'border border-red-600 bg-red-50 text-red-600 font-medium'
                        : 'border border-gray-200 text-gray-700 hover:border-red-600/30'
                    }`}
                  >
                    {label.ko}
                  </button>
                )
              }
            )}
          </div>
        </div>

        {/* Total sunlight threshold */}
        <div className="mb-3 border border-gray-200 rounded p-2.5">
          <label className="text-[10px] font-semibold text-gray-600 block mb-2">총일조시간 계산</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">시작</label>
              <select
                value={config.totalThreshold.startHour}
                onChange={(e) => onConfigChange({
                  totalThreshold: { ...config.totalThreshold, startHour: Number(e.target.value) }
                })}
                disabled={disabled}
                className="w-full border border-gray-200 px-1.5 py-1 text-xs
                  focus:outline-none focus:border-red-600/30 disabled:opacity-50"
              >
                {Array.from({ length: 13 }, (_, i) => i + 5).map((h) => (
                  <option key={h} value={h}>{h}시</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">끝</label>
              <select
                value={config.totalThreshold.endHour}
                onChange={(e) => onConfigChange({
                  totalThreshold: { ...config.totalThreshold, endHour: Number(e.target.value) }
                })}
                disabled={disabled}
                className="w-full border border-gray-200 px-1.5 py-1 text-xs
                  focus:outline-none focus:border-red-600/30 disabled:opacity-50"
              >
                {Array.from({ length: 13 }, (_, i) => i + 10).map((h) => (
                  <option key={h} value={h}>{h}시</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">수인한도</label>
              <select
                value={config.totalThreshold.requiredHours}
                onChange={(e) => onConfigChange({
                  totalThreshold: { ...config.totalThreshold, requiredHours: Number(e.target.value) }
                })}
                disabled={disabled}
                className="w-full border border-gray-200 px-1.5 py-1 text-xs
                  focus:outline-none focus:border-red-600/30 disabled:opacity-50"
              >
                {[1, 2, 3, 4, 5, 6].map((h) => (
                  <option key={h} value={h}>{h}시간</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Continuous sunlight threshold */}
        <div className="mb-3 border border-gray-200 rounded p-2.5">
          <label className="text-[10px] font-semibold text-gray-600 block mb-2">연속일조시간 계산</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">시작</label>
              <select
                value={config.continuousThreshold.startHour}
                onChange={(e) => onConfigChange({
                  continuousThreshold: { ...config.continuousThreshold, startHour: Number(e.target.value) }
                })}
                disabled={disabled}
                className="w-full border border-gray-200 px-1.5 py-1 text-xs
                  focus:outline-none focus:border-red-600/30 disabled:opacity-50"
              >
                {Array.from({ length: 13 }, (_, i) => i + 5).map((h) => (
                  <option key={h} value={h}>{h}시</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">끝</label>
              <select
                value={config.continuousThreshold.endHour}
                onChange={(e) => onConfigChange({
                  continuousThreshold: { ...config.continuousThreshold, endHour: Number(e.target.value) }
                })}
                disabled={disabled}
                className="w-full border border-gray-200 px-1.5 py-1 text-xs
                  focus:outline-none focus:border-red-600/30 disabled:opacity-50"
              >
                {Array.from({ length: 13 }, (_, i) => i + 10).map((h) => (
                  <option key={h} value={h}>{h}시</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5">수인한도</label>
              <select
                value={config.continuousThreshold.requiredHours}
                onChange={(e) => onConfigChange({
                  continuousThreshold: { ...config.continuousThreshold, requiredHours: Number(e.target.value) }
                })}
                disabled={disabled}
                className="w-full border border-gray-200 px-1.5 py-1 text-xs
                  focus:outline-none focus:border-red-600/30 disabled:opacity-50"
              >
                {[1, 2, 3, 4].map((h) => (
                  <option key={h} value={h}>{h}시간</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 기본값 지정 / 복원 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={saveDefaults}
            disabled={disabled}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] border border-gray-200
              text-gray-600 hover:border-red-600/30 hover:text-red-600 transition-all
              disabled:opacity-50"
            title="현재 설정을 기본값으로 저장"
          >
            <Save size={10} />
            기본값 지정
          </button>
          {hasSavedDefaults && (
            <button
              type="button"
              onClick={clearDefaults}
              className="flex items-center gap-1 text-[10px] text-gray-400
                hover:text-red-500 transition-colors"
              title="저장된 기본값 삭제"
            >
              <RotateCcw size={10} />
              초기화
            </button>
          )}
        </div>
      </WorkspacePanelSection>

      {/* ── 레이어 관리 ── */}
      {layers.length > 0 && (
        <WorkspacePanelSection
          title="레이어"
          icon={<Grid3X3 size={14} />}
          badge={layers.length}
          defaultOpen={false}
        >
          <LayerPanel
            layers={layers}
            onToggleVisibility={onToggleLayerVisibility || (() => {})}
            onToggleAnalysisTarget={onToggleAnalysisTarget || (() => {})}
            onToggleAll={onToggleAllLayers}
          />
        </WorkspacePanelSection>
      )}

      {/* ── 측정점 그룹 ── */}
      <WorkspacePanelSection
        title="측정점 그룹"
        icon={<List size={14} />}
        badge={points.length}
        defaultOpen={true}
      >
        {/* 그룹 탭 */}
        <div className="flex items-center gap-1 mb-2 overflow-x-auto">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => onSetActiveGroup(g.id)}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-full
                whitespace-nowrap transition-all ${
                activeGroupId === g.id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {g.name}
              <span className="text-[10px] opacity-70">{g.points.length}</span>
            </button>
          ))}
          <button
            onClick={() => {
              const name = `${groups.length + 1}동`
              onAddGroup(name)
            }}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="그룹 추가"
          >
            <FolderPlus size={14} />
          </button>
        </div>

        {/* 활성 그룹 컨트롤 */}
        {activeGroupId && (() => {
          const activeGroup = groups.find((g) => g.id === activeGroupId)
          if (!activeGroup) return null

          return (
            <div className="space-y-2">
              {/* 그룹명 편집 + 정렬 버튼 */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={activeGroup.name}
                  onChange={(e) => onRenameGroup(activeGroup.id, e.target.value)}
                  className="flex-1 border border-gray-200 px-2 py-1 text-xs
                    focus:outline-none focus:border-red-600/30"
                  disabled={disabled}
                />
                <button
                  onClick={() => onSortGroup(activeGroup.id)}
                  className="p-1.5 border border-gray-200 text-gray-500 hover:text-red-600
                    hover:border-red-600/30 transition-colors"
                  title="행/열 자동 정렬"
                >
                  <ArrowUpDown size={12} />
                </button>
                <button
                  onClick={() => onToggleReverseColumns(activeGroup.id)}
                  className={`p-1.5 border transition-colors ${
                    activeGroup.reverseColumns
                      ? 'border-red-600 text-red-600 bg-red-50'
                      : 'border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-600/30'
                  }`}
                  title="열 순서 반전"
                >
                  <ArrowRightLeft size={12} />
                </button>
                {groups.length > 1 && (
                  <button
                    onClick={() => onRemoveGroup(activeGroup.id)}
                    className="p-1.5 border border-gray-200 text-gray-400 hover:text-red-500
                      hover:border-red-300 transition-colors"
                    title="그룹 삭제"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* 포인트 리스트 (행/열 표시) */}
              {activeGroup.points.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-3 text-center">
                  <Crosshair size={18} className="text-gray-300" />
                  <p className="text-xs text-gray-400">
                    3D 뷰에서 지면/건물을 클릭하여<br />측정점을 배치하세요
                  </p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  {/* 헤더 */}
                  {activeGroup.sorted && (
                    <div className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-400
                      border-b border-gray-100 sticky top-0 bg-white">
                      <span className="w-8 text-center">행</span>
                      <span className="w-8 text-center">열</span>
                      <span className="flex-1">이름</span>
                      <span className="text-right">좌표</span>
                    </div>
                  )}
                  {/* 포인트 목록 */}
                  <div className="space-y-0.5">
                    {activeGroup.points.map((pt) => {
                      const isSelected = selectedPointId === pt.id
                      return (
                        <button
                          key={pt.id}
                          onClick={() => onPointSelect?.(pt.id)}
                          className={`w-full flex items-center gap-1 text-left px-2 py-1 text-xs
                            rounded transition-colors ${
                            isSelected
                              ? 'bg-red-50 text-red-600'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {activeGroup.sorted && (
                            <>
                              <span className="w-8 text-center tabular-nums text-[10px]">{pt.row}</span>
                              <span className="w-8 text-center tabular-nums text-[10px]">{pt.column}</span>
                            </>
                          )}
                          <span className="flex-1 truncate">{pt.name}</span>
                          <span className={`text-[10px] tabular-nums ${
                            isSelected ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {pt.x.toFixed(1)}, {pt.y.toFixed(1)}, {pt.z.toFixed(1)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </WorkspacePanelSection>

      {/* ── 결과 (분석 완료 후) ── */}
      {results && (
        <>
          <WorkspacePanelSection title="결과 요약" icon={<BarChart3 size={14} />}>
            <SunlightComplianceSummary summary={results.summary} />
          </WorkspacePanelSection>

          <WorkspacePanelSection title="결과 테이블" icon={<List size={14} />} defaultOpen={false}>
            <div className="max-h-60 overflow-y-auto">
              <SunlightResultsTable
                points={results.points}
                selectedPointId={selectedPointId}
                onPointSelect={onPointSelect}
              />
            </div>
          </WorkspacePanelSection>

          <WorkspacePanelSection title="시간별 차트" icon={<Clock size={14} />} defaultOpen={false}>
            {selectedPoint ? (
              <SunlightHourlyChart
                point={selectedPoint}
                timeStart={results.time_window.start}
                stepMinutes={results.time_window.step_minutes}
              />
            ) : (
              <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
                <Crosshair size={14} className="text-gray-300" />
                결과 테이블에서 측정점을 선택하세요
              </div>
            )}
          </WorkspacePanelSection>

          {/* Report */}
          <WorkspacePanelSection title="보고서" icon={<FileSpreadsheet size={14} />} defaultOpen={false}>
            <div className="flex items-center gap-2">
              {!reportDownloadUrl && onGenerateReport && (
                <button
                  onClick={onGenerateReport}
                  disabled={isGeneratingReport}
                  className="flex items-center gap-1.5 border border-gray-200 hover:border-red-600/30
                    px-3 py-1.5 text-xs text-gray-900 hover:text-red-600 transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingReport && <Loader2 size={12} className="animate-spin" />}
                  {isGeneratingReport ? '보고서 생성 중...' : 'Excel 보고서 생성'}
                </button>
              )}
              {reportDownloadUrl && (
                <a
                  href={reportDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 border border-green-200 hover:border-green-400
                    px-3 py-1.5 text-xs text-green-700 hover:text-green-800 transition-all"
                >
                  Excel 다운로드
                </a>
              )}
            </div>
          </WorkspacePanelSection>

          {/* Cause analysis */}
          {causeResult && causeResult.total_non_compliant > 0 && (
            <WorkspacePanelSection title="원인 분석" icon={<Search size={14} />} defaultOpen={false}>
              <CauseAnalysisView
                causeResult={causeResult}
                selectedBuildingId={selectedBuildingId}
                onBuildingSelect={onBuildingSelect}
              />
            </WorkspacePanelSection>
          )}

          {/* Optimization */}
          {causeResult && causeResult.total_non_compliant > 0 && (
            <WorkspacePanelSection title="최적안 검토" icon={<Sparkles size={14} />} defaultOpen={false}>
              <OptimizationPanel
                apiUrl={apiUrl}
                sessionId={sessionId}
                causeResult={causeResult}
                analysisResult={results}
                measurementPoints={points.map(p => ({ x: p.position.x, y: p.position.y, z: p.position.z }))}
                config={{
                  latitude: config.latitude,
                  longitude: config.longitude,
                  timezone: config.timezone,
                  date: config.date,
                }}
              />
            </WorkspacePanelSection>
          )}

          {/* Ground analysis */}
          <WorkspacePanelSection title="지반일조 분석" icon={<Grid3X3 size={14} />} defaultOpen={false}>
            <div className="space-y-3">
              {/* Grid interval */}
              <div>
                <label className="text-[10px] font-medium text-gray-500 block mb-1.5">
                  격자 간격 (m)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0.5}
                    max={10}
                    step={0.5}
                    value={gridInterval}
                    onChange={(e) => onGridIntervalChange?.(Number(e.target.value))}
                    disabled={disabled}
                    className="flex-1 accent-red-600 h-1.5"
                  />
                  <input
                    type="number"
                    min={0.5}
                    max={10}
                    step={0.5}
                    value={gridInterval}
                    onChange={(e) => onGridIntervalChange?.(Number(e.target.value))}
                    disabled={disabled}
                    className="w-16 border border-gray-200 px-1.5 py-1 text-xs tabular-nums
                      text-center focus:outline-none focus:border-red-600/30 disabled:opacity-50"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  간격이 작을수록 정밀하지만 분석 시간이 증가합니다
                </p>
              </div>

              {/* Run button */}
              <button
                onClick={onStartGroundAnalysis}
                disabled={disabled || isGroundAnalysisRunning || !results}
                className="w-full flex items-center justify-center gap-2 border border-gray-200
                  hover:border-red-600/30 py-2 text-xs text-gray-900 hover:text-red-600
                  transition-all disabled:opacity-40 disabled:cursor-not-allowed
                  disabled:hover:border-gray-200 disabled:hover:text-gray-900"
              >
                {isGroundAnalysisRunning && <Loader2 size={12} className="animate-spin" />}
                {isGroundAnalysisRunning ? '지반 분석 중...' : '지반일조 분석'}
              </button>
              {!results && (
                <p className="text-[10px] text-gray-400 text-center">
                  일조 분석 완료 후 사용 가능
                </p>
              )}
            </div>
          </WorkspacePanelSection>
        </>
      )}
    </WorkspaceSidePanel>
  )
}
