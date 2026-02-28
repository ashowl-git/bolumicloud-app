'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import type { ModuleConfig } from '@/lib/types/navigation'

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
      <div className="relative border border-gray-200 p-6 opacity-50 cursor-not-allowed select-none">
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] text-gray-400 border border-gray-200 rounded-full">
            <Clock size={10} />
            {t({ ko: '준비 중', en: 'Coming soon' })}
          </span>
        </div>
        <Icon size={28} strokeWidth={1} className="text-gray-300 mb-3" />
        <h3 className="text-sm font-medium text-gray-500 mb-1">{t(module.name)}</h3>
        <p className="text-xs text-gray-400 leading-relaxed">{t(module.description)}</p>
      </div>
    )
  }

  return (
    <Link href={href} className="group">
      <div className="border border-gray-200 p-6 transition-all duration-200 hover:border-red-600/30 hover:shadow-sm">
        <Icon size={28} strokeWidth={1} className="text-gray-600 group-hover:text-red-600 transition-colors mb-3" />
        <h3 className="text-sm font-medium text-gray-900 mb-1">{t(module.name)}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{t(module.description)}</p>
      </div>
    </Link>
  )
}
