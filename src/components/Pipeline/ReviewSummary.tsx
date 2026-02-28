'use client'

import { RENDER_TIME_ESTIMATES, MAX_RENDERS } from '@/lib/types/pipeline'
import type { AnalysisDate, QualityLevel, RenderParams } from '@/lib/types/pipeline'

interface ReviewSummaryProps {
  config: {
    latitude: number
    longitude: number
    timezone: number
    dates: AnalysisDate[]
    selectedHours: number[]
    skyType: 'sunny_with_sun' | 'cloudy' | 'intermediate'
  }
  vfNames: string[]
  hasMtl: boolean
  quality: QualityLevel
  resolution: number
  renderParams: RenderParams
}

const SKY_LABELS: Record<string, string> = {
  sunny_with_sun: '맑음+태양 (Sunny+Sun)',
  cloudy: '흐림 (Cloudy)',
  intermediate: '중간 (Intermediate)',
}

function formatEstimate(totalSeconds: number): string {
  if (totalSeconds < 60) return `~${totalSeconds}초`
  const min = totalSeconds / 60
  if (min < 60) return `~${min.toFixed(1)}분`
  const hr = min / 60
  return `~${hr.toFixed(1)}시간`
}

export default function ReviewSummary({ config, vfNames, hasMtl, quality, resolution, renderParams }: ReviewSummaryProps) {
  const isCustom = quality === 'custom'
  const vfCount = vfNames.length
  const dateCount = config.dates.length
  const hourCount = config.selectedHours.length
  const renderCount = vfCount * dateCount * hourCount
  const perRender = isCustom ? RENDER_TIME_ESTIMATES.medium : RENDER_TIME_ESTIMATES[quality]
  const totalSeconds = renderCount * perRender
  const exceeds = renderCount > MAX_RENDERS

  const sortedHours = [...config.selectedHours].sort((a, b) => a - b)
  const hourRange =
    sortedHours.length > 0
      ? `${sortedHours[0]}:00 ~ ${sortedHours[sortedHours.length - 1]}:00`
      : '-'

  return (
    <div className="border border-gray-200 p-6 space-y-4">
      <h3 className="text-sm font-medium text-gray-900 mb-2">분석 요약</h3>

      <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Location</span>
          <span className="text-gray-900">
            ({config.latitude.toFixed(2)}, {config.longitude.toFixed(2)})
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Timezone</span>
          <span className="text-gray-900">+{config.timezone}</span>
        </div>
        <div className="flex justify-between col-span-2">
          <span className="text-gray-500">VF ({vfCount}개)</span>
          <span className="text-gray-900 text-right">
            {vfNames.join(', ')}
          </span>
        </div>
        <div className="flex justify-between col-span-2">
          <span className="text-gray-500">Dates ({dateCount}개)</span>
          <span className="text-gray-900 text-right">
            {config.dates.map(d =>
              d.label !== 'custom' ? `${d.label}(${d.month}/${d.day})` : `${d.month}/${d.day}`
            ).join(', ')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Hours</span>
          <span className="text-gray-900">
            {hourRange} ({hourCount}개)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Sky</span>
          <span className="text-gray-900">{SKY_LABELS[config.skyType]}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Quality</span>
          <span className="text-gray-900">
            {isCustom
              ? `Custom (${resolution}x${resolution}, ab${renderParams.ab} ad${renderParams.ad} as${renderParams.as})`
              : `${quality.charAt(0).toUpperCase() + quality.slice(1)} (${resolution}x${resolution}, ab${renderParams.ab})`
            }
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Materials</span>
          <span className={hasMtl ? 'text-green-600' : 'text-amber-500'}>
            {hasMtl ? 'MTL 포함' : 'MTL 없음 (회색 기본값)'}
          </span>
        </div>
      </div>

      {/* Estimation banner */}
      <div className="border-t border-gray-100 pt-4 mt-4">
        <div className={`p-4 ${exceeds ? 'bg-red-50' : 'bg-gray-50'}`}>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{vfCount}</span> VFs x{' '}
            <span className="font-medium">{dateCount}</span> dates x{' '}
            <span className="font-medium">{hourCount}</span> hours ={' '}
            <span className={`font-medium ${exceeds ? 'text-red-600' : 'text-gray-900'}`}>
              {renderCount} renders
            </span>
            {' '} x ~{perRender}s ={' '}
            <span className="font-medium text-red-600">{formatEstimate(totalSeconds)}</span> (예상)
          </p>
          {exceeds && (
            <p className="text-xs text-red-600 mt-1">
              최대 {MAX_RENDERS}개를 초과합니다. VF, 날짜, 또는 시간을 줄여주세요.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
