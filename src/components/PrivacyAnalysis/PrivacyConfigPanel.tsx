'use client'

import { useLocalizedText } from '@/hooks/useLocalizedText'
import { SUB_GRID_LABELS } from '@/lib/types/privacy'
import type { PrivacyConfigState, SubGridResolution } from '@/lib/types/privacy'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  threshold: { ko: '분석 거리 임계값', en: 'Distance Threshold' } as LocalizedText,
  thresholdUnit: { ko: 'm (이 거리 이내의 창문 쌍만 분석)', en: 'm (analyze pairs within this distance)' } as LocalizedText,
  subGrid: { ko: '서브그리드 해상도', en: 'Sub-grid Resolution' } as LocalizedText,
  piiThreshold: { ko: 'PII 임계값', en: 'PII Threshold' } as LocalizedText,
  piiUnit: { ko: 'sr (기본값 0.0005)', en: 'sr (default 0.0005)' } as LocalizedText,
  windowCount: { ko: '등록된 창문', en: 'Registered Windows' } as LocalizedText,
  observer: { ko: '관찰 창문', en: 'Observer' } as LocalizedText,
  target: { ko: '대상 창문', en: 'Target' } as LocalizedText,
}

interface PrivacyConfigPanelProps {
  config: PrivacyConfigState
  onChange: (partial: Partial<PrivacyConfigState>) => void
  disabled?: boolean
}

export default function PrivacyConfigPanel({ config, onChange, disabled }: PrivacyConfigPanelProps) {
  const { t } = useLocalizedText()

  return (
    <div className="space-y-6">
      {/* Distance Threshold */}
      <div className="border border-gray-200 p-6">
        <label className="text-sm font-medium text-gray-900 mb-3 block">
          {t(txt.threshold)}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={10}
            max={500}
            step={10}
            value={config.distanceThreshold}
            onChange={(e) => onChange({ distanceThreshold: Number(e.target.value) })}
            disabled={disabled}
            className="flex-1 accent-red-600"
          />
          <span className="text-sm tabular-nums text-gray-700 w-16 text-right">
            {config.distanceThreshold}m
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">{t(txt.thresholdUnit)}</p>
      </div>

      {/* Sub-grid Resolution */}
      <div className="border border-gray-200 p-6">
        <label className="text-sm font-medium text-gray-900 mb-3 block">
          {t(txt.subGrid)}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(SUB_GRID_LABELS) as [string, typeof SUB_GRID_LABELS[3]][]).map(
            ([value, info]) => {
              const numValue = Number(value) as SubGridResolution
              const isSelected = config.subGridResolution === numValue
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange({ subGridResolution: numValue })}
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

      {/* PII Threshold */}
      <div className="border border-gray-200 p-6">
        <label className="text-sm font-medium text-gray-900 mb-3 block">
          {t(txt.piiThreshold)}
        </label>
        <input
          type="number"
          step="0.0001"
          min={0.0001}
          max={0.01}
          value={config.piiThreshold}
          onChange={(e) => onChange({ piiThreshold: Number(e.target.value) })}
          disabled={disabled}
          className="w-full border border-gray-200 px-3 py-2 text-sm
            focus:outline-none focus:border-red-600/30 disabled:opacity-50"
        />
        <p className="text-xs text-gray-400 mt-1">{t(txt.piiUnit)}</p>
      </div>

      {/* Window Count Summary */}
      <div className="border border-gray-200 p-4">
        <p className="text-xs text-gray-500">
          {t(txt.windowCount)}: {t(txt.observer)} {config.observerWindows.length}개 | {t(txt.target)} {config.targetWindows.length}개
        </p>
      </div>
    </div>
  )
}
