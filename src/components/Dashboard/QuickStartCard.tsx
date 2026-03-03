'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  title: { ko: '빠른 시작', en: 'Quick Start' } as LocalizedText,
  subtitle: { ko: '가장 많이 사용하는 분석을 바로 시작하세요', en: 'Jump into your most-used analyses' } as LocalizedText,
}

const QUICK_LINKS: { name: LocalizedText; href: string; accent: string }[] = [
  {
    name: { ko: '현휘 분석', en: 'Glare Analysis' },
    href: '/analysis/glare',
    accent: 'border-red-200 hover:border-red-400',
  },
  {
    name: { ko: '일조 분석', en: 'Sunlight Analysis' },
    href: '/analysis/sunlight',
    accent: 'border-amber-200 hover:border-amber-400',
  },
  {
    name: { ko: '조망 분석', en: 'View Analysis' },
    href: '/analysis/view',
    accent: 'border-blue-200 hover:border-blue-400',
  },
]

export default function QuickStartCard() {
  const { t } = useLocalizedText()

  return (
    <div className="border border-gray-200 p-6 mb-8">
      <h3 className="text-sm font-medium text-gray-900 mb-1">{t(txt.title)}</h3>
      <p className="text-xs text-gray-500 mb-4">{t(txt.subtitle)}</p>
      <div className="flex flex-wrap gap-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`group inline-flex items-center gap-2 border px-4 py-2.5
              text-sm text-gray-700 hover:text-gray-900 transition-all duration-200
              hover:-translate-y-px ${link.accent}`}
          >
            {t(link.name)}
            <ArrowRight
              size={14}
              className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all duration-200"
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
