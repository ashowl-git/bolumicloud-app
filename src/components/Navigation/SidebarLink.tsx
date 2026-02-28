'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import type { ModuleConfig } from '@/lib/types/navigation'

interface SidebarLinkProps {
  module: ModuleConfig
  basePath: string
  onNavigate?: () => void
}

export default function SidebarLink({ module, basePath, onNavigate }: SidebarLinkProps) {
  const pathname = usePathname()
  const { t } = useLocalizedText()
  const href = `${basePath}/${module.slug}`
  const isActive = pathname === href
  const isComingSoon = module.status === 'coming-soon'

  const Icon = module.icon

  if (isComingSoon) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 cursor-not-allowed select-none">
        <Icon size={16} strokeWidth={1.5} />
        <span className="flex-1">{t(module.name)}</span>
        <Clock size={12} />
      </div>
    )
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`
        flex items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150
        ${isActive
          ? 'bg-red-50 text-red-600 border-l-2 border-red-600 font-medium'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent'
        }
      `}
    >
      <Icon size={16} strokeWidth={1.5} />
      <span className="flex-1">{t(module.name)}</span>
    </Link>
  )
}
