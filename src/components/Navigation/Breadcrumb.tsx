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
    <nav aria-label="Breadcrumb" className="px-4 md:px-6 py-2 bg-gray-50 border-b border-gray-100">
      <ol className="flex items-center gap-1 text-xs text-gray-500">
        {crumbs.map((crumb, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-gray-300" />}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-gray-900 transition-colors">
                {t(crumb.name)}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">{t(crumb.name)}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
