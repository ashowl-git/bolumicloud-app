'use client'

import { QUALITY_DETAILS, RENDER_TIME_ESTIMATES } from '@/lib/types/pipeline'

interface ReviewSummaryProps {
  config: {
    latitude: number
    longitude: number
    timezone: number
    month: number
    day: number
    selectedHours: number[]
    skyType: 'sunny_with_sun' | 'cloudy' | 'intermediate'
  }
  hasMtl: boolean
  quality: 'low' | 'medium' | 'high'
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

export default function ReviewSummary({ config, hasMtl, quality }: ReviewSummaryProps) {
  const detail = QUALITY_DETAILS[quality]
  const renderCount = config.selectedHours.length
  const perRender = RENDER_TIME_ESTIMATES[quality]
  const totalSeconds = renderCount * perRender

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
        <div className="flex justify-between">
          <span className="text-gray-500">Date</span>
          <span className="text-gray-900">
            {config.month}/{config.day}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Hours</span>
          <span className="text-gray-900">
            {hourRange} ({renderCount} renders)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Sky</span>
          <span className="text-gray-900">{SKY_LABELS[config.skyType]}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Quality</span>
          <span className="text-gray-900">
            {quality.charAt(0).toUpperCase() + quality.slice(1)} ({detail.resolution}x{detail.resolution}, ab{detail.ab})
          </span>
        </div>
        <div className="flex justify-between col-span-2">
          <span className="text-gray-500">Materials</span>
          <span className={hasMtl ? 'text-green-600' : 'text-amber-500'}>
            {hasMtl ? 'MTL 포함' : 'MTL 없음 (회색 기본값)'}
          </span>
        </div>
      </div>

      {/* Estimation banner */}
      <div className="border-t border-gray-100 pt-4 mt-4">
        <div className="bg-gray-50 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{renderCount}</span> renders x{' '}
              <span className="font-medium">~{perRender}s</span> ={' '}
              <span className="font-medium text-red-600">{formatEstimate(totalSeconds)}</span> (예상)
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">
              해상도: {detail.resolution} x {detail.resolution}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
