'use client'

import { useContext } from 'react'
import { Menu } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import { useApi } from '@/contexts/ApiContext'
import { LocaleContext } from '@/hooks/useLocalizedText'
import type { Locale } from '@/lib/types/i18n'

export default function PlatformNavbar() {
  const { setIsMobileOpen } = useSidebar()
  const { backendStatus } = useApi()
  const { locale, setLocale } = useContext(LocaleContext)

  const toggleLocale = () => {
    setLocale(locale === 'ko' ? 'en' : 'ko' as Locale)
  }

  return (
    <header className="sticky top-0 z-30 flex items-center h-14 px-4 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      {/* Backend status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${
              backendStatus === 'healthy' ? 'bg-green-500' :
              backendStatus === 'checking' ? 'bg-yellow-400 animate-pulse' :
              'bg-red-500'
            }`}
          />
          <span className="text-xs text-gray-500 hidden sm:inline">
            {backendStatus === 'healthy' ? 'API' :
             backendStatus === 'checking' ? '...' : 'Offline'}
          </span>
        </div>

        <div className="h-4 w-px bg-gray-200" />

        {/* Language toggle */}
        <button
          onClick={toggleLocale}
          className="px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-200 rounded transition-colors"
        >
          {locale === 'ko' ? 'EN' : 'KO'}
        </button>
      </div>
    </header>
  )
}
