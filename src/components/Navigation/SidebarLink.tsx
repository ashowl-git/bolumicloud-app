'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import type { ModuleConfig } from '@/lib/types/navigation'

interface SidebarLinkProps {
  module: ModuleConfig
  basePath: string
  collapsed?: boolean
  onNavigate?: () => void
}

export default function SidebarLink({ module, basePath, collapsed, onNavigate }: SidebarLinkProps) {
  const pathname = usePathname()
  const { t } = useLocalizedText()
  const href = `${basePath}/${module.slug}`
  const isActive = pathname === href
  const isComingSoon = module.status === 'coming-soon'

  const Icon = module.icon

  if (isComingSoon) {
    if (collapsed) {
      return (
        <div
          className="flex items-center justify-center w-10 h-10 mx-auto my-0.5 text-gray-300 cursor-not-allowed"
          title={t(module.name)}
          aria-disabled="true"
        >
          <Icon size={18} strokeWidth={1.5} />
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 cursor-not-allowed select-none" aria-disabled="true">
        <Icon size={16} strokeWidth={1.5} />
        <span className="flex-1">{t(module.name)}</span>
        <Clock size={12} />
      </div>
    )
  }

  if (collapsed) {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        title={t(module.name)}
        aria-current={isActive ? 'page' : undefined}
        className={`
          flex items-center justify-center w-10 h-10 mx-auto my-0.5
          rounded transition-all duration-150
          ${isActive
            ? 'bg-red-50 text-red-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }
        `}
      >
        <Icon size={18} strokeWidth={isActive ? 1.8 : 1.5} />
      </Link>
    )
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={`
        group flex items-center gap-2.5 px-3 py-2 text-sm
        transition-all duration-150 border-l-2
        ${isActive
          ? 'bg-red-50 text-red-600 border-red-600 font-medium'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent hover:border-gray-200'
        }
      `}
    >
      <Icon
        size={16}
        strokeWidth={isActive ? 1.8 : 1.5}
        className={isActive ? 'text-red-600' : 'text-gray-500 group-hover:text-gray-700 transition-colors duration-150'}
      />
      <span className="flex-1">{t(module.name)}</span>
      {isActive && (
        <div className="w-1 h-1 rounded-full bg-red-600" />
      )}
    </Link>
  )
}
