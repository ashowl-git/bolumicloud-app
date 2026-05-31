'use client'

import { useState, useCallback, useEffect } from 'react'
import { Calendar, Save, RotateCcw } from 'lucide-react'
import {
  BUILDING_TYPE_LABELS,
  RESOLUTION_LABELS,
  SUNLIGHT_DATE_PRESETS,
  SOLAR_TIME_MODE_LABELS,
} from '@/lib/types/sunlight'
import type {
  SunlightConfigState,
  BuildingType,
  AnalysisResolution,
  SolarTimeMode,
} from '@/lib/types/sunlight'

import WorkspacePanelSection from '../Workspace/WorkspacePanelSection'
import HelpTooltip from '@/components/shared/HelpTooltip'

const DEFAULTS_STORAGE_KEY = 'bolumicloud-sunlight-defaults'

interface DateTimeConfigSectionProps {
  config: SunlightConfigState
  onConfigChange: (partial: Partial<SunlightConfigState>) => void
  disabled?: boolean
}

export default function DateTimeConfigSection({
  config,
  onConfigChange,
  disabled,
}: DateTimeConfigSectionProps) {
  const [hasSavedDefaults, setHasSavedDefaults] = useState(false)

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

  return (
    <WorkspacePanelSection title="날짜 / 해상도" icon={<Calendar size={14} />} defaultOpen={false}>
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
        <label className="text-[10px] font-medium text-gray-500 block mb-1.5">
          기준시
          <HelpTooltip text="진태양시: 해시계 기준 시각. 표준시: 시계 기준 시각. 법규 판정은 진태양시가 원칙" />
        </label>
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
        <label className="text-[10px] font-semibold text-gray-600 block mb-2">
          총일조시간 계산
          <HelpTooltip text="지정 시간대 내 햇빛이 비치는 누적 시간. 법규: 동지 기준 4시간 이상" />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label htmlFor="dt-total-start" className="text-[10px] text-gray-500 block mb-0.5">시작</label>
            <select
              id="dt-total-start"
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
            <label htmlFor="dt-total-end" className="text-[10px] text-gray-500 block mb-0.5">끝</label>
            <select
              id="dt-total-end"
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
            <label htmlFor="dt-total-req" className="text-[10px] text-gray-500 block mb-0.5">
              수인한도
              <HelpTooltip text="이 시간 미만이면 일조권 침해 판정" />
            </label>
            <select
              id="dt-total-req"
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
        <label className="text-[10px] font-semibold text-gray-600 block mb-2">
          연속일조시간 계산
          <HelpTooltip text="끊기지 않고 연속으로 햇빛이 비치는 시간. 법규: 동지 기준 2시간 이상" />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label htmlFor="dt-cont-start" className="text-[10px] text-gray-500 block mb-0.5">시작</label>
            <select
              id="dt-cont-start"
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
            <label htmlFor="dt-cont-end" className="text-[10px] text-gray-500 block mb-0.5">끝</label>
            <select
              id="dt-cont-end"
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
            <label htmlFor="dt-cont-req" className="text-[10px] text-gray-500 block mb-0.5">
              수인한도
              <HelpTooltip text="이 시간 미만이면 일조권 침해 판정" />
            </label>
            <select
              id="dt-cont-req"
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
  )
}
