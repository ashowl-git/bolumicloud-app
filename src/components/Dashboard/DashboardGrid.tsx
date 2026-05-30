'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { useApi } from '@/contexts/ApiContext'
import { NAVIGATION } from '@/lib/navigationConfig'
import ModuleCard from './ModuleCard'
import QuickStartCard from './QuickStartCard'
import StatsSummary from './StatsSummary'
import RecentProjects from './RecentProjects'
import WelcomeBanner from './WelcomeBanner'
import BoLumiCloudMark from '@/components/BoLumiCloud/BoLumiCloudMark'
import Badge from '@/components/common/Badge'

export default function DashboardGrid() {
  const { t } = useLocalizedText()
  const { backendStatus } = useApi()
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const sections = NAVIGATION
    .filter((s) => s.modules.length > 1)
    .map((section) => ({
      section,
      modules: q
        ? section.modules.filter(
            (m) =>
              t(m.name).toLowerCase().includes(q) ||
              t(m.description).toLowerCase().includes(q) ||
              m.slug.toLowerCase().includes(q),
          )
        : section.modules,
    }))
    .filter((s) => s.modules.length > 0)

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      {/* Branding + Status */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BoLumiCloudMark size={32} className="text-slate-900 dark:text-slate-100" />
          <h1 className="text-2xl font-light text-slate-900 dark:text-slate-100">
            B<span className="text-red-600">o</span>LumiCloud
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {t({ ko: '건축 빛환경 시뮬레이션 플랫폼', en: 'Architectural lighting simulation platform' })}
          </p>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                backendStatus === 'healthy' ? 'bg-green-500' :
                backendStatus === 'checking' ? 'bg-yellow-400 animate-pulse' :
                'bg-red-500'
              }`}
            />
            <span className="text-xs text-gray-400 dark:text-slate-500">
              {backendStatus === 'healthy' ? 'API Online' :
               backendStatus === 'checking' ? 'Checking...' : 'API Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Welcome Banner (first visit) */}
      <WelcomeBanner />

      {/* Quick Start */}
      <QuickStartCard />

      {/* Recent Projects */}
      <RecentProjects />

      {/* Stats Summary */}
      <StatsSummary />

      {/* Module search */}
      <div className="mb-6 relative max-w-sm">
        <Search
          size={15}
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t({ ko: '모듈 검색...', en: 'Search modules...' })}
          aria-label={t({ ko: '모듈 검색', en: 'Search modules' })}
          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 pl-9 pr-3 py-2
            text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500
            transition-colors hover:border-gray-300 dark:hover:border-slate-600
            focus:outline-none focus-visible:ring-1 focus-visible:ring-red-600/30 focus:border-red-600/40"
        />
      </div>

      {/* Module Grid by Section */}
      {sections.map(({ section, modules }, idx) => {
        const SectionIcon = section.icon
        return (
          <motion.div
            key={section.id}
            className="mb-10"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(idx * 0.05, 0.2), ease: 'easeOut' }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400">
                <SectionIcon size={15} strokeWidth={1.75} />
              </span>
              <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                {t(section.name)}
              </h2>
              <Badge variant="neutral" size="sm">{modules.length}</Badge>
              <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700 ml-1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((mod) => (
                <ModuleCard key={mod.id} module={mod} basePath={section.basePath} />
              ))}
            </div>
          </motion.div>
        )
      })}

      {sections.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-slate-500 py-12 text-center">
          {t({ ko: `"${query}" 검색 결과가 없습니다`, en: `No modules match "${query}"` })}
        </p>
      )}
    </div>
  )
}
