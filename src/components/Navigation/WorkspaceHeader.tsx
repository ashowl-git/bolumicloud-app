'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { cn } from '@/lib/cn'
import type { LocalizedText } from '@/lib/types/i18n'

// ─── WorkspaceHeader ─────────────────────────────
// 분석 워크스페이스(full-bleed)에서 breadcrumb 이 숨겨져 위치 파악·형제 분석
// 전환이 불가한 문제를 해소하는 얇은 컨텍스트 바.
// 좌: 경로(홈 > 분석 > 현재), 우: 형제 분석 빠른 전환.

const WORKSPACES: { slug: string; label: LocalizedText }[] = [
  { slug: 'sunlight', label: { ko: '일조', en: 'Sunlight' } },
  { slug: 'solar-pv', label: { ko: '태양광', en: 'Solar PV' } },
  { slug: 'view', label: { ko: '조망', en: 'View' } },
  { slug: 'privacy', label: { ko: '사생활', en: 'Privacy' } },
]

export default function WorkspaceHeader() {
  const pathname = usePathname()
  const { t } = useLocalizedText()
  const current = WORKSPACES.find((w) => pathname?.endsWith(`/analysis/${w.slug}`))

  return (
    <div className="flex items-center justify-between gap-3 px-4 h-9 shrink-0
      border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs">
      {/* 경로 */}
      <nav className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500 min-w-0" aria-label="현재 위치">
        <Link href="/" className="inline-flex items-center hover:text-gray-700 dark:hover:text-slate-300 transition-colors" title="홈">
          <Home size={13} />
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-gray-500 dark:text-slate-400">{t({ ko: '분석', en: 'Analysis' })}</span>
        {current && (
          <>
            <span aria-hidden="true">/</span>
            <span className="text-gray-800 dark:text-slate-200 font-medium truncate">
              {t(current.label)} {t({ ko: '분석', en: '' })}
            </span>
          </>
        )}
      </nav>

      {/* 형제 분석 빠른 전환 */}
      <div className="flex items-center gap-0.5 shrink-0" role="group" aria-label="분석 전환">
        {WORKSPACES.map((w) => {
          const active = pathname?.endsWith(`/analysis/${w.slug}`)
          return (
            <Link
              key={w.slug}
              href={`/analysis/${w.slug}`}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'px-2 py-0.5 rounded transition-colors',
                active
                  ? 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 font-medium'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-700',
              )}
            >
              {t(w.label)}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
