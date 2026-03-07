'use client'

import { ScanEye, Wrench, ShieldCheck } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { NAVIGATION } from '@/lib/navigationConfig'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  title: { ko: '플랫폼 현황', en: 'Platform Overview' } as LocalizedText,
  totalModules: { ko: '전체 모듈', en: 'Total Modules' } as LocalizedText,
  analysisModules: { ko: '분석 모듈', en: 'Analysis' } as LocalizedText,
  toolModules: { ko: '도구', en: 'Tools' } as LocalizedText,
  complianceModules: { ko: '법규', en: 'Compliance' } as LocalizedText,
}

const SECTION_ICONS: Record<string, typeof ScanEye> = {
  analysis: ScanEye,
  tools: Wrench,
  compliance: ShieldCheck,
}

export default function StatsSummary() {
  const { t } = useLocalizedText()

  const stats = NAVIGATION.filter((s) => s.modules.length > 1).map((section) => ({
    id: section.id,
    name: section.name,
    count: section.modules.filter((m) => m.status === 'active').length,
    total: section.modules.length,
    Icon: SECTION_ICONS[section.id] || ScanEye,
  }))

  const totalActive = stats.reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <div className="border border-gray-200 p-5">
        <p className="text-xs text-gray-500 mb-1">{t(txt.totalModules)}</p>
        <p className="text-3xl font-light text-gray-900">{totalActive}</p>
      </div>
      {stats.map((stat) => {
        const Icon = stat.Icon
        return (
          <div key={stat.id} className="border border-gray-200 p-5">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={12} strokeWidth={1.5} className="text-gray-400" />
              <p className="text-xs text-gray-500">{t(stat.name)}</p>
            </div>
            <p className="text-3xl font-light text-gray-900">{stat.count}</p>
          </div>
        )
      })}
    </div>
  )
}
