'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { getBreadcrumbs } from '@/lib/navigationConfig'

export default function Breadcrumb() {
  const pathname = usePathname()
  const { t } = useLocalizedText()
  const crumbs = getBreadcrumbs(pathname)

  if (crumbs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="px-4 md:px-6 py-2 bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-800">
      <ol className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
        {crumbs.map((crumb, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-gray-300 dark:text-slate-600" />}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-gray-900 transition-colors">
                {t(crumb.name)}
              </Link>
            ) : (
              <span className="text-gray-900 dark:text-slate-100 font-medium">{t(crumb.name)}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
