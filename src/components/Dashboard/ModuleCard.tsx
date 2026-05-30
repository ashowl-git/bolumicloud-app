'use client'

import Link from 'next/link'
import { Clock, ArrowUpRight } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import type { ModuleConfig } from '@/lib/types/navigation'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'

interface ModuleCardProps {
  module: ModuleConfig
  basePath: string
}

export default function ModuleCard({ module, basePath }: ModuleCardProps) {
  const { t } = useLocalizedText()
  const href = `${basePath}/${module.slug}`
  const isComingSoon = module.status === 'coming-soon'
  const Icon = module.icon

  if (isComingSoon) {
    return (
      <Card padding="lg" className="relative h-full opacity-60 cursor-not-allowed select-none">
        <div className="absolute top-3 right-3">
          <Badge variant="neutral" size="sm">
            <Clock size={10} aria-hidden="true" />
            {t({ ko: '준비 중', en: 'Coming soon' })}
          </Badge>
        </div>
        <span className="inline-flex items-center justify-center w-9 h-9 bg-gray-50 text-gray-300 mb-3">
          <Icon size={20} strokeWidth={1.5} />
        </span>
        <h3 className="text-sm font-semibold text-gray-500 mb-1">{t(module.name)}</h3>
        <p className="text-xs text-gray-400 leading-relaxed">{t(module.description)}</p>
      </Card>
    )
  }

  return (
    <Link href={href} className="group block h-full">
      <Card
        padding="lg"
        className="h-full transition-all duration-200
          group-hover:border-red-600/30 group-hover:shadow-sm group-hover:-translate-y-0.5
          group-active:translate-y-0 group-active:shadow-none"
      >
        <div className="flex items-start justify-between mb-3">
          <span
            className="inline-flex items-center justify-center w-9 h-9 bg-gray-50 text-gray-600
              transition-colors duration-200 group-hover:bg-red-50 group-hover:text-red-600"
          >
            <Icon size={20} strokeWidth={1.5} />
          </span>
          <ArrowUpRight
            size={16}
            aria-hidden="true"
            className="text-gray-300 transition-all duration-200
              group-hover:text-red-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{t(module.name)}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{t(module.description)}</p>
      </Card>
    </Link>
  )
}
