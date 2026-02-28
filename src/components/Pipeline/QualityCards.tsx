'use client'

import { useState } from 'react'
import { Zap, Scale, Gem, ChevronDown, ChevronUp } from 'lucide-react'
import { QUALITY_DETAILS } from '@/lib/types/pipeline'
import type { QualityPreset, QualityLevel, RenderParams } from '@/lib/types/pipeline'

interface QualityCardsProps {
  selected: QualityLevel
  resolution: number
  renderParams: RenderParams
  onPresetChange: (q: QualityPreset) => void
  onParamsChange: (resolution: number, renderParams: RenderParams) => void
  disabled?: boolean
}

const LABELS: Record<QualityPreset, { title: string; time: string; icon: typeof Zap }> = {
  low:    { title: 'Low',    time: '~30s / render', icon: Zap },
  medium: { title: 'Medium', time: '~2min / render', icon: Scale },
  high:   { title: 'High',   time: '~8min / render', icon: Gem },
}

const PARAM_DESCRIPTIONS: Record<string, { ko: string; en: string }> = {
  resolution: { ko: '이미지 해상도 (px)', en: 'Image resolution (px)' },
  ab: { ko: '빛 반사 횟수 (ambient bounces)', en: 'Light bounce count' },
  ad: { ko: '간접광 샘플 수 (ambient divisions)', en: 'Indirect light samples' },
  as: { ko: '보조 샘플 수 (ambient super-samples)', en: 'Super-samples' },
}

export default function QualityCards({
  selected,
  resolution,
  renderParams,
  onPresetChange,
  onParamsChange,
  disabled,
}: QualityCardsProps) {
  const [expanded, setExpanded] = useState(false)
  const presets: QualityPreset[] = ['low', 'medium', 'high']

  const handleSliderChange = (
    field: 'resolution' | 'ab' | 'ad' | 'as',
    value: number,
  ) => {
    if (field === 'resolution') {
      onParamsChange(value, renderParams)
    } else {
      const updated = { ...renderParams, [field]: value }
      // ar은 ad에 연동 (ar = ad / 32)
      if (field === 'ad') {
        updated.ar = Math.round(value / 32)
      }
      onParamsChange(resolution, updated)
    }
  }

  return (
    <div className="space-y-4">
      {/* Preset Cards */}
      <div className="grid grid-cols-3 gap-4">
        {presets.map((level) => {
          const isSelected = selected === level
          const detail = QUALITY_DETAILS[level]
          const label = LABELS[level]
          const Icon = label.icon

          return (
            <button
              key={level}
              type="button"
              onClick={() => onPresetChange(level)}
              disabled={disabled}
              className={`p-4 text-left cursor-pointer transition-all duration-300 border-2 ${
                isSelected
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-200 hover:border-red-600/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} strokeWidth={1.5} className={isSelected ? 'text-red-600' : 'text-gray-500'} />
                <p className={`text-sm font-medium ${isSelected ? 'text-red-600' : 'text-gray-900'}`}>
                  {label.title}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {detail.resolution} x {detail.resolution}
              </p>
              <p className="text-xs text-gray-500">ab{detail.ab}</p>
              <p className="text-xs text-gray-400 mt-2">{label.time}</p>
            </button>
          )
        })}
      </div>

      {/* Custom indicator */}
      {selected === 'custom' && (
        <div className="border-2 border-amber-400 bg-amber-50 px-4 py-2">
          <p className="text-sm font-medium text-amber-700">
            Custom ({resolution}x{resolution}, ab{renderParams.ab} ad{renderParams.ad} as{renderParams.as})
          </p>
        </div>
      )}

      {/* Expandable Detail Settings */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        disabled={disabled}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700
          transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        상세 설정
      </button>

      {expanded && (
        <div className="border border-gray-200 p-6 space-y-6">
          {/* Resolution Slider */}
          <SliderRow
            label="Resolution"
            description={PARAM_DESCRIPTIONS.resolution.ko}
            value={resolution}
            min={250}
            max={3000}
            step={250}
            disabled={disabled}
            onChange={(v) => handleSliderChange('resolution', v)}
          />

          {/* ab Slider */}
          <SliderRow
            label="ab"
            description={PARAM_DESCRIPTIONS.ab.ko}
            value={renderParams.ab}
            min={2}
            max={8}
            step={1}
            disabled={disabled}
            onChange={(v) => handleSliderChange('ab', v)}
          />

          {/* ad Slider */}
          <SliderRow
            label="ad"
            description={PARAM_DESCRIPTIONS.ad.ko}
            value={renderParams.ad}
            min={512}
            max={8192}
            step={512}
            disabled={disabled}
            onChange={(v) => handleSliderChange('ad', v)}
          />

          {/* as Slider */}
          <SliderRow
            label="as"
            description={PARAM_DESCRIPTIONS.as.ko}
            value={renderParams.as}
            min={64}
            max={512}
            step={64}
            disabled={disabled}
            onChange={(v) => handleSliderChange('as', v)}
          />

          {/* ar (read-only, derived from ad) */}
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-mono text-gray-700">ar</span>
              <span className="text-gray-400 ml-2">= ad / 32 (자동 연동)</span>
            </div>
            <span className="font-mono text-gray-900">{renderParams.ar}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function SliderRow({
  label,
  description,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  label: string
  description: string
  value: number
  min: number
  max: number
  step: number
  disabled?: boolean
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-mono text-gray-700">{label}</span>
          <span className="text-xs text-gray-400 ml-2">{description}</span>
        </div>
        <span className="text-sm font-mono text-gray-900 min-w-[60px] text-right">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:bg-red-600
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
