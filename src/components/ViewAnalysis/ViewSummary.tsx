'use client'

import { Eye } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import type { ViewSummary as ViewSummaryType } from '@/lib/types/view'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  title: { ko: '조망 분석 요약', en: 'View Analysis Summary' } as LocalizedText,
  totalObservers: { ko: '관찰점 수', en: 'Observers' } as LocalizedText,
  averageSvf: { ko: '평균 SVF', en: 'Average SVF' } as LocalizedText,
  minSvf: { ko: '최소 SVF', en: 'Min SVF' } as LocalizedText,
  maxSvf: { ko: '최대 SVF', en: 'Max SVF' } as LocalizedText,
}

function getSvfGrade(svf: number): { label: string; color: string } {
  if (svf >= 0.50) return { label: '1등급 (우수)', color: 'text-green-600' }
  if (svf >= 0.35) return { label: '2등급 (양호)', color: 'text-blue-600' }
  if (svf >= 0.20) return { label: '3등급 (보통)', color: 'text-amber-600' }
  return { label: '4등급 (미흡)', color: 'text-red-600' }
}

interface ViewSummaryProps {
  summary: ViewSummaryType
}

export default function ViewSummary({ summary }: ViewSummaryProps) {
  const { t } = useLocalizedText()
  const grade = getSvfGrade(summary.average_svf)

  return (
    <div className="space-y-6">
      <div
        className={`border p-6 ${
          summary.average_svf >= 0.50
            ? 'border-green-200 bg-green-50'
            : summary.average_svf >= 0.35
            ? 'border-blue-200 bg-blue-50'
            : summary.average_svf >= 0.20
            ? 'border-amber-200 bg-amber-50'
            : 'border-red-200 bg-red-50'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <Eye size={24} className="text-gray-600" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">{t(txt.title)}</h3>
            <p className={`text-sm ${grade.color}`}>{grade.label}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">{t(txt.totalObservers)}</p>
            <p className="text-3xl font-light text-gray-900">{summary.total_observers}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">{t(txt.averageSvf)}</p>
            <p className={`text-3xl font-light ${grade.color}`}>
              {(summary.average_svf * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">{t(txt.minSvf)}</p>
            <p className="text-3xl font-light text-gray-900">
              {(summary.min_svf * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">{t(txt.maxSvf)}</p>
            <p className="text-3xl font-light text-gray-900">
              {(summary.max_svf * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 p-4">
        <p className="text-xs text-gray-500">
          SVF(천공개방률): 관찰점에서 하늘이 보이는 비율. 주택성능등급 기준 — 1등급: 50% 이상 | 2등급: 35% 이상 | 3등급: 20% 이상
        </p>
      </div>
    </div>
  )
}
