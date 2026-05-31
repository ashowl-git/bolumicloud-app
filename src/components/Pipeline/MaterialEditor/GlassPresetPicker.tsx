'use client'

import {
  GLASS_CATEGORY_LABELS,
  ENHANCED_GLASS_PRESETS,
  colorToHex,
  getGlareRisk,
} from '@/lib/materialPresets'
import type { GlassCategory, EnhancedGlassPreset } from '@/lib/materialPresets'

interface GlassPresetPickerProps {
  glassCategory: GlassCategory | 'all'
  onCategoryChange: (cat: GlassCategory | 'all') => void
  activePresetLabel: string | null
  onApplyPreset: (preset: EnhancedGlassPreset) => void
  disabled?: boolean
}

export default function GlassPresetPicker({
  glassCategory,
  onCategoryChange,
  activePresetLabel,
  onApplyPreset,
  disabled,
}: GlassPresetPickerProps) {
  const filteredPresets = glassCategory === 'all'
    ? ENHANCED_GLASS_PRESETS
    : ENHANCED_GLASS_PRESETS.filter(p => p.category === glassCategory)

  return (
    <div>
      <label className="text-xs text-gray-500 mb-2 block">유리 프리셋</label>

      {/* Category filter tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onCategoryChange('all')}
          className={`px-2.5 py-1 text-[10px] border transition-all whitespace-nowrap ${
            glassCategory === 'all'
              ? 'border-red-600 text-red-600 bg-red-50'
              : 'border-gray-200 text-gray-500 hover:border-gray-400'
          }`}
        >
          전체 ({ENHANCED_GLASS_PRESETS.length})
        </button>
        {(Object.entries(GLASS_CATEGORY_LABELS) as [GlassCategory, string][]).map(([key, label]) => {
          const count = ENHANCED_GLASS_PRESETS.filter(p => p.category === key).length
          return (
            <button
              key={key}
              type="button"
              onClick={() => onCategoryChange(key)}
              className={`px-2.5 py-1 text-[10px] border transition-all whitespace-nowrap ${
                glassCategory === key
                  ? 'border-red-600 text-red-600 bg-red-50'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {label} ({count})
            </button>
          )
        })}
      </div>

      {/* Preset cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {filteredPresets.map((preset) => {
          const presetRisk = getGlareRisk(preset.vlr)
          const isActive = activePresetLabel === preset.label
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onApplyPreset(preset)}
              disabled={disabled}
              className={`border px-2 py-2 text-left transition-all disabled:opacity-50
                hover:border-red-600/30 ${
                  isActive
                    ? 'border-red-600 bg-red-50/50'
                    : 'border-gray-200'
                }`}
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 border border-gray-300 flex-shrink-0"
                  style={{
                    backgroundColor: colorToHex(preset.r, preset.g, preset.b),
                    opacity: 0.7,
                  }}
                />
                <span className="text-[11px] text-gray-700 font-medium truncate">
                  {preset.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-sky-600 font-medium">
                  T{(preset.vlt * 100).toFixed(0)}
                </span>
                <span className={`text-[10px] font-medium ${presetRisk.color}`}>
                  R{(preset.vlr * 100).toFixed(0)}
                </span>
                <span className="text-[10px] text-gray-400">
                  SHGC {preset.shgc}
                </span>
              </div>
              {preset.note && (
                <p className="text-[9px] text-orange-500 mt-0.5 truncate">
                  {preset.note}
                </p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
