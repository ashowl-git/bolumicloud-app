'use client'

import { useLocalizedText } from '@/hooks/useLocalizedText'
import { GRADE_COLORS, GRADE_DOMAINS } from '@/lib/types/performance'
import type { PerformanceResult } from '@/lib/types/performance'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  title: { ko: '성능등급 종합 결과', en: 'Performance Grade Summary' } as LocalizedText,
  gradeDistribution: { ko: '등급 분포', en: 'Grade Distribution' } as LocalizedText,
  avgDaylight: { ko: '단지 평균 채광률', en: 'Average DF' } as LocalizedText,
  minDaylight: { ko: '최소 채광률', en: 'Minimum DF' } as LocalizedText,
  livingEnvGrade: { ko: '생활환경 등급', en: 'Living Env Grade' } as LocalizedText,
  separationPairs: { ko: '인동거리 쌍', en: 'Separation Pairs' } as LocalizedText,
  unitCount: { ko: '세대 수', en: 'Units' } as LocalizedText,
}

interface GradeSummaryProps {
  result: PerformanceResult
}

export default function GradeSummary({ result }: GradeSummaryProps) {
  const { t } = useLocalizedText()
  const livingGrade = GRADE_COLORS[result.living_environment_grade] || GRADE_COLORS[3]

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className={`border p-6 ${livingGrade.bg} border-gray-200`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{t(txt.title)}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">{t(txt.livingEnvGrade)}</p>
            <p className={`text-3xl font-light ${livingGrade.text}`}>
              {livingGrade.label}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">{t(txt.avgDaylight)}</p>
            <p className="text-3xl font-light text-gray-900">{result.average_daylight_factor}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">{t(txt.minDaylight)}</p>
            <p className="text-3xl font-light text-gray-900">{result.minimum_daylight_factor}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">{t(txt.unitCount)}</p>
            <p className="text-3xl font-light text-gray-900">{result.unit_daylight_table.length}</p>
          </div>
        </div>
      </div>

      {/* Grade Distribution Bar */}
      <div className="border border-gray-200 p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">{t(txt.gradeDistribution)}</h4>
        <div className="flex h-8 overflow-hidden">
          {[1, 2, 3, 4].map((g) => {
            const count = result.grade_distribution[`grade${g}` as keyof typeof result.grade_distribution]
            const total = result.categories.length
            const pct = total > 0 ? (count / total) * 100 : 0
            if (pct === 0) return null
            const colors = GRADE_COLORS[g]
            return (
              <div
                key={g}
                className={`flex items-center justify-center text-xs font-medium ${colors.bg} ${colors.text}`}
                style={{ width: `${pct}%` }}
              >
                {count}
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-3">
          {[1, 2, 3, 4].map((g) => {
            const count = result.grade_distribution[`grade${g}` as keyof typeof result.grade_distribution]
            const colors = GRADE_COLORS[g]
            return (
              <span key={g} className={`text-xs ${colors.text}`}>
                {g}등급: {count}개
              </span>
            )
          })}
        </div>
      </div>

      {/* Category Grid */}
      <div className="border border-gray-200 p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {result.categories.map((cat) => {
            const colors = GRADE_COLORS[cat.grade] || GRADE_COLORS[3]
            const domainMeta = GRADE_DOMAINS.find((d) => d.domain === cat.domain)
            return (
              <div key={cat.id} className="border border-gray-100 p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{cat.domain}</p>
                  <p className="text-sm text-gray-700">{cat.name}</p>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
                  style={{ borderLeft: `3px solid ${domainMeta?.color || '#888'}` }}
                >
                  {cat.grade}등급
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Separation Table */}
      {result.separation_table.length > 0 && (
        <div className="border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">{t(txt.separationPairs)}</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-left text-xs text-gray-500">기준건물</th>
                <th className="px-3 py-2 text-left text-xs text-gray-500">차폐건물</th>
                <th className="px-3 py-2 text-left text-xs text-gray-500">거리(m)</th>
                <th className="px-3 py-2 text-left text-xs text-gray-500">높이(m)</th>
                <th className="px-3 py-2 text-left text-xs text-gray-500">R</th>
                <th className="px-3 py-2 text-left text-xs text-gray-500">적합</th>
              </tr>
            </thead>
            <tbody>
              {result.separation_table.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-gray-700">{row.from_building_name}</td>
                  <td className="px-3 py-2 text-gray-700">{row.to_building_name}</td>
                  <td className="px-3 py-2 tabular-nums">{row.distance.toFixed(1)}</td>
                  <td className="px-3 py-2 tabular-nums">{row.to_height.toFixed(1)}</td>
                  <td className="px-3 py-2 tabular-nums">{row.ratio.toFixed(3)}</td>
                  <td className={`px-3 py-2 ${row.compliant ? 'text-green-600' : 'text-red-600'}`}>
                    {row.compliant ? '적합' : '부적합'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
