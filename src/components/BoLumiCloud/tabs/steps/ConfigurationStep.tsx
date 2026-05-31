'use client'

import { motion } from 'framer-motion'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import MaterialEditor from '@/components/Pipeline/MaterialEditor'
import LocationTimeConfig from '@/components/Pipeline/LocationTimeConfig'
import type { LocationTimeConfigState } from '@/components/Pipeline/LocationTimeConfig'
import QualityCards from '@/components/Pipeline/QualityCards'
import type { MaterialOverride, QualityPreset, QualityLevel, RenderParams } from '@/lib/types/pipeline'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  back: { ko: '이전', en: 'Back' } as LocalizedText,
  continue: { ko: '다음', en: 'Continue' } as LocalizedText,
  quality: { ko: '렌더 품질', en: 'Render Quality' } as LocalizedText,
  hoursRequired: { ko: '시간을 1개 이상 선택해주세요', en: 'Select at least 1 hour' } as LocalizedText,
  datesRequired: { ko: '날짜를 1개 이상 선택해주세요', en: 'Select at least 1 date' } as LocalizedText,
  renderExceeds: { ko: '렌더 수가 최대값을 초과합니다', en: 'Render count exceeds maximum' } as LocalizedText,
}

const fadeVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

interface ConfigurationStepProps {
  apiUrl: string
  sessionId: string | null
  config: LocationTimeConfigState
  quality: QualityLevel
  resolution: number
  renderParams: RenderParams
  materialOverrides: Record<string, MaterialOverride>
  vfCount: number
  isRunning: boolean
  renderExceeds: boolean
  onConfigChange: (partial: Partial<LocationTimeConfigState>) => void
  onPresetChange: (q: QualityPreset) => void
  onParamsChange: (newRes: number, newParams: RenderParams) => void
  onMaterialOverridesChange: (overrides: Record<string, MaterialOverride>) => void
  onContinue: () => void
  onBack: () => void
}

export default function ConfigurationStep({
  apiUrl,
  sessionId,
  config,
  quality,
  resolution,
  renderParams,
  materialOverrides,
  vfCount,
  isRunning,
  renderExceeds,
  onConfigChange,
  onPresetChange,
  onParamsChange,
  onMaterialOverridesChange,
  onContinue,
  onBack,
}: ConfigurationStepProps) {
  const { t } = useLocalizedText()

  return (
    <motion.div
      key="step-2"
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      {sessionId && (
        <MaterialEditor
          apiUrl={apiUrl}
          sessionId={sessionId}
          overrides={materialOverrides}
          onChange={onMaterialOverridesChange}
          disabled={isRunning}
        />
      )}

      <LocationTimeConfig
        config={config}
        onChange={onConfigChange}
        vfCount={vfCount}
        disabled={isRunning}
      />

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">{t(txt.quality)}</h3>
        <QualityCards
          selected={quality}
          resolution={resolution}
          renderParams={renderParams}
          onPresetChange={onPresetChange}
          onParamsChange={onParamsChange}
          disabled={isRunning}
        />
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <button
          onClick={onBack}
          className="border border-gray-200 hover:border-gray-400 px-6 py-3
            text-sm text-gray-700 hover:text-gray-900 transition-all duration-300"
        >
          {t(txt.back)}
        </button>
        <button
          onClick={onContinue}
          disabled={config.selectedHours.length === 0 || config.dates.length === 0 || renderExceeds}
          className="border border-gray-200 hover:border-red-600/30 px-8 py-3
            text-gray-900 hover:text-red-600 transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t(txt.continue)}
        </button>
        {config.selectedHours.length === 0 && (
          <span className="text-xs text-red-400">{t(txt.hoursRequired)}</span>
        )}
        {config.dates.length === 0 && (
          <span className="text-xs text-red-400">{t(txt.datesRequired)}</span>
        )}
        {renderExceeds && (
          <span className="text-xs text-red-400">{t(txt.renderExceeds)}</span>
        )}
      </div>
    </motion.div>
  )
}
