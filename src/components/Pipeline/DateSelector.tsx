'use client'

import { useState, useCallback } from 'react'
import type { AnalysisDate } from '@/lib/types/pipeline'
import { DATE_PRESETS } from '@/lib/types/pipeline'

interface DateSelectorProps {
  selectedDates: AnalysisDate[]
  onChange: (dates: AnalysisDate[]) => void
  disabled?: boolean
}

export default function DateSelector({ selectedDates, onChange, disabled }: DateSelectorProps) {
  const [customMonth, setCustomMonth] = useState(1)
  const [customDay, setCustomDay] = useState(1)

  const isPresetSelected = useCallback(
    (preset: AnalysisDate) =>
      selectedDates.some(d => d.month === preset.month && d.day === preset.day),
    [selectedDates]
  )

  const togglePreset = useCallback(
    (preset: AnalysisDate) => {
      if (isPresetSelected(preset)) {
        onChange(selectedDates.filter(d => !(d.month === preset.month && d.day === preset.day)))
      } else {
        onChange([...selectedDates, preset])
      }
    },
    [selectedDates, onChange, isPresetSelected]
  )

  const addCustomDate = useCallback(() => {
    const exists = selectedDates.some(d => d.month === customMonth && d.day === customDay)
    if (exists) return
    onChange([...selectedDates, { month: customMonth, day: customDay, label: 'custom' }])
  }, [selectedDates, onChange, customMonth, customDay])

  const removeDate = useCallback(
    (idx: number) => {
      onChange(selectedDates.filter((_, i) => i !== idx))
    },
    [selectedDates, onChange]
  )

  return (
    <div className="space-y-4">
      {/* Preset toggles */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">날짜 프리셋</label>
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map((preset) => {
            const active = isPresetSelected(preset)
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => togglePreset(preset)}
                disabled={disabled}
                className={`border px-4 py-2 text-sm transition-all duration-300 disabled:opacity-50 ${
                  active
                    ? 'border-red-600 bg-red-50 text-red-600'
                    : 'border-gray-200 hover:border-red-600/30 text-gray-700 hover:text-red-600'
                }`}
              >
                {preset.label} ({preset.month}/{preset.day})
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom date input */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">커스텀 날짜 추가</label>
        <div className="flex items-center gap-2">
          <select
            value={customMonth}
            onChange={(e) => setCustomMonth(Number(e.target.value))}
            disabled={disabled}
            className="border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:opacity-50"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={31}
            value={customDay}
            onChange={(e) => setCustomDay(Number(e.target.value))}
            disabled={disabled}
            className="w-20 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:opacity-50"
            placeholder="일"
          />
          <button
            type="button"
            onClick={addCustomDate}
            disabled={disabled}
            className="border border-gray-200 hover:border-red-600/30 px-4 py-2
              text-sm text-gray-700 hover:text-red-600 transition-all duration-300 disabled:opacity-50"
          >
            추가
          </button>
        </div>
      </div>

      {/* Selected dates list */}
      {selectedDates.length > 0 && (
        <div>
          <label className="text-xs text-gray-500 mb-2 block">선택된 날짜 ({selectedDates.length}개)</label>
          <div className="flex flex-wrap gap-2">
            {selectedDates.map((date, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm"
              >
                <span className="text-gray-700">
                  {date.label !== 'custom' ? `${date.label} ` : ''}{date.month}/{date.day}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeDate(idx)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    x
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
