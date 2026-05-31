'use client'

import { useLocalizedText } from '@/hooks/useLocalizedText'
import { useApi } from '@/contexts/ApiContext'
import { NAVIGATION } from '@/lib/navigationConfig'
import ModuleCard from './ModuleCard'
import QuickStartCard from './QuickStartCard'
import StatsSummary from './StatsSummary'
import RecentProjects from './RecentProjects'
import WelcomeBanner from './WelcomeBanner'
import BoLumiCloudMark from '@/components/BoLumiCloud/BoLumiCloudMark'

export default function DashboardGrid() {
  const { t } = useLocalizedText()
  const { backendStatus } = useApi()

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      {/* Branding + Status */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BoLumiCloudMark size={32} className="text-slate-900" />
          <h1 className="text-2xl font-light text-slate-900">
            B<span className="text-red-600">o</span>LumiCloud
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">
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
            <span className="text-xs text-gray-400">
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

      {/* Module Grid by Section (skip standalone pages like Projects) */}
      {NAVIGATION.filter((s) => s.modules.length > 1).map((section) => {
        const SectionIcon = section.icon
        return (
          <div key={section.id} className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <SectionIcon size={16} strokeWidth={1.5} className="text-gray-400" />
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t(section.name)}
              </h2>
              <div className="flex-1 h-px bg-gray-100 ml-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.modules.map((mod) => (
                <ModuleCard key={mod.id} module={mod} basePath={section.basePath} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
