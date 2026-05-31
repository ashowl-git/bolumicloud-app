'use client'

import { useLocalizedText } from '@/hooks/useLocalizedText'
import { GRADE_COLORS, GRADE_ITEMS } from '@/lib/types/performance'
import type { PerformanceGrades, GradeInput } from '@/lib/types/performance'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  gradeEntry: { ko: '등급 입력', en: 'Grade Entry' } as LocalizedText,
  auto: { ko: '자동 산출', en: 'Auto-calculated' } as LocalizedText,
  criteria: { ko: '기준', en: 'Criteria' } as LocalizedText,
}

interface GradeResultCardProps {
  grades: PerformanceGrades
  onGradeChange: (key: keyof PerformanceGrades, grade: Partial<GradeInput>) => void
  disabled?: boolean
}

export default function GradeResultCard({ grades, onGradeChange, disabled }: GradeResultCardProps) {
  const { t } = useLocalizedText()

  const domains = ['소음', '구조', '환경', '화재', '관리', '에너지'] as const

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium text-gray-900">{t(txt.gradeEntry)}</h3>

      {domains.map((domain) => {
        const items = GRADE_ITEMS.filter((item) => item.domain === domain)
        return (
          <div key={domain} className="border border-gray-200 p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">{domain}</h4>
            <div className="space-y-3">
              {items.map((item) => {
                const gi: GradeInput = grades[item.id]
                const isAuto = item.id === 'env_living'
                const gradeInfo = GRADE_COLORS[gi.grade] || GRADE_COLORS[3]

                return (
                  <div key={item.id} className="flex items-center gap-4">
                    <span className="text-sm text-gray-700 w-32 shrink-0">{t(item.name)}</span>

                    {isAuto ? (
                      <span className={`text-sm px-2 py-0.5 ${gradeInfo.bg} ${gradeInfo.text}`}>
                        {gradeInfo.label} ({t(txt.auto)})
                      </span>
                    ) : (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((g) => (
                          <button
                            key={g}
                            onClick={() => onGradeChange(item.id, { grade: g as 1 | 2 | 3 | 4 })}
                            disabled={disabled}
                            className={`px-3 py-1 text-xs border transition-all duration-300 disabled:opacity-50 ${
                              gi.grade === g
                                ? `${GRADE_COLORS[g].bg} ${GRADE_COLORS[g].text} border-current`
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {g}등급
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Criteria tooltip */}
                    <span className="text-xs text-gray-400 hidden sm:inline">
                      {t(txt.criteria)}: {item.criteria[`grade${gi.grade}` as keyof typeof item.criteria]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
