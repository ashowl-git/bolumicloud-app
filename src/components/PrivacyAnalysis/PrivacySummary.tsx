'use client'

import { EyeOff } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import type { PrivacySummary as PrivacySummaryType } from '@/lib/types/privacy'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  title: { ko: '사생활 분석 요약', en: 'Privacy Analysis Summary' } as LocalizedText,
  totalPairs: { ko: '분석 쌍', en: 'Pairs Analyzed' } as LocalizedText,
  infringedPairs: { ko: '침해 쌍', en: 'Infringed Pairs' } as LocalizedText,
  infringementRate: { ko: '침해율', en: 'Infringement Rate' } as LocalizedText,
  closestDistance: { ko: '최근접 거리', en: 'Closest Distance' } as LocalizedText,
  severe: { ko: '심각', en: 'Severe' } as LocalizedText,
  caution: { ko: '주의', en: 'Caution' } as LocalizedText,
  good: { ko: '양호', en: 'Good' } as LocalizedText,
}

function getOverallStatus(summary: PrivacySummaryType): { label: string; color: string; border: string; bg: string } {
  if (summary.grade_distribution.severe > 0) return { label: '침해 발견', color: 'text-red-600', border: 'border-red-200', bg: 'bg-red-50' }
  if (summary.grade_distribution.caution > 0) return { label: '주의 필요', color: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50' }
  return { label: '양호', color: 'text-green-600', border: 'border-green-200', bg: 'bg-green-50' }
}

interface PrivacySummaryProps {
  summary: PrivacySummaryType
}

export default function PrivacySummary({ summary }: PrivacySummaryProps) {
  const { t } = useLocalizedText()
  const status = getOverallStatus(summary)

  return (
    <div className="space-y-6">
      <div className={`border p-6 ${status.border} ${status.bg}`}>
        <div className="flex items-center gap-3 mb-4">
          <EyeOff size={24} className="text-gray-600" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">{t(txt.title)}</h3>
            <p className={`text-sm ${status.color}`}>{status.label}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">{t(txt.totalPairs)}</p>
            <p className="text-3xl font-light text-gray-900">{summary.total_pairs_analyzed}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">{t(txt.infringedPairs)}</p>
            <p className={`text-3xl font-light ${summary.infringed_pairs > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.infringed_pairs}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">{t(txt.infringementRate)}</p>
            <p className={`text-3xl font-light ${summary.infringement_rate > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {summary.infringement_rate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">{t(txt.closestDistance)}</p>
            <p className="text-3xl font-light text-gray-900">{summary.closest_distance.toFixed(1)}m</p>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="flex gap-6 mt-6 pt-4 border-t border-gray-200/50">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-sm text-gray-700">{t(txt.severe)}: {summary.grade_distribution.severe}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-full" />
            <span className="text-sm text-gray-700">{t(txt.caution)}: {summary.grade_distribution.caution}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm text-gray-700">{t(txt.good)}: {summary.grade_distribution.good}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
