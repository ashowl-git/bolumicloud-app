'use client'

import { CheckCircle2, XCircle, Building2 } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { BUILDING_TYPE_LABELS } from '@/lib/types/sunlight'
import type { SunlightSummary, BuildingType } from '@/lib/types/sunlight'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  complianceTitle: { ko: '법규 판정 결과', en: 'Compliance Result' } as LocalizedText,
  compliant: { ko: '적합', en: 'Compliant' } as LocalizedText,
  nonCompliant: { ko: '부적합', en: 'Non-compliant' } as LocalizedText,
  totalPoints: { ko: '총 측정점', en: 'Total Points' } as LocalizedText,
  compliantPoints: { ko: '적합 측정점', en: 'Compliant Points' } as LocalizedText,
  complianceRate: { ko: '적합률', en: 'Compliance Rate' } as LocalizedText,
  regulation: { ko: '적용 법규', en: 'Regulation' } as LocalizedText,
}

interface SunlightComplianceSummaryProps {
  summary: SunlightSummary
}

export default function SunlightComplianceSummary({ summary }: SunlightComplianceSummaryProps) {
  const { t } = useLocalizedText()
  const isFullyCompliant = summary.compliance_rate === 100

  return (
    <div className="space-y-6">
      {/* Overall status card */}
      <div
        className={`border p-6 ${
          isFullyCompliant
            ? 'border-green-200 bg-green-50'
            : summary.compliance_rate >= 80
            ? 'border-amber-200 bg-amber-50'
            : 'border-red-200 bg-red-50'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          {isFullyCompliant ? (
            <CheckCircle2 size={24} className="text-green-600" />
          ) : (
            <XCircle size={24} className="text-red-600" />
          )}
          <h3 className="text-lg font-medium text-gray-900">{t(txt.complianceTitle)}</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">{t(txt.totalPoints)}</p>
            <p className="text-3xl font-light text-gray-900">{summary.total_points}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">{t(txt.compliantPoints)}</p>
            <p className="text-3xl font-light text-green-600">{summary.compliant_points}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">{t(txt.complianceRate)}</p>
            <p
              className={`text-3xl font-light ${
                isFullyCompliant ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {summary.compliance_rate}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">{t(txt.regulation)}</p>
            <p className="text-sm text-gray-700 mt-2">{summary.regulation_reference}</p>
            <div className="flex items-center gap-1 mt-1">
              <Building2 size={12} className="text-gray-400" />
              <span className="text-xs text-gray-500">
                {t(BUILDING_TYPE_LABELS[summary.building_type])}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Criteria explanation */}
      <div className="border border-gray-200 p-4">
        <p className="text-xs text-gray-500">
          {summary.building_type === 'apartment'
            ? '공동주택(아파트): 동지 기준 총일조 4시간 이상 또는 연속일조 2시간 이상 (OR 조건)'
            : summary.building_type === 'detached'
            ? '단독/다세대: 동지 기준 연속일조 4시간 이상'
            : '기타: 공동주택 기준 적용 (보수적)'}
        </p>
      </div>
    </div>
  )
}
