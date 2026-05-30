'use client'

import { ScanEye, Wrench, ShieldCheck } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { NAVIGATION } from '@/lib/navigationConfig'
import type { LocalizedText } from '@/lib/types/i18n'
import Card from '@/components/common/Card'

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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      <Card padding="md">
        <p className="text-xs text-gray-500 mb-2">{t(txt.totalModules)}</p>
        <p className="text-3xl font-semibold text-gray-900 tabular-nums leading-none">{totalActive}</p>
      </Card>
      {stats.map((stat) => {
        const Icon = stat.Icon
        return (
          <Card key={stat.id} padding="md">
            <div className="flex items-center gap-1.5 mb-2 text-gray-500">
              <Icon size={13} strokeWidth={1.75} />
              <p className="text-xs">{t(stat.name)}</p>
            </div>
            <p className="text-3xl font-semibold text-gray-900 tabular-nums leading-none">
              {stat.count}
              <span className="text-base font-normal text-gray-400">/{stat.total}</span>
            </p>
          </Card>
        )
      })}
    </div>
  )
}
