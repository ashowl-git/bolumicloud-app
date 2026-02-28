'use client'

import { Clock } from 'lucide-react'

interface SubTabsProps {
  tabs: { id: string; label: string; status?: 'active' | 'coming' }[]
  active: string
  onChange: (tab: string) => void
}

export default function SubTabs({ tabs, active, onChange }: SubTabsProps) {
  return (
    <div className="py-3 border-b border-gray-200">
      <div className="flex gap-3 flex-wrap">
        {tabs.map((tab) => {
          const isActive = active === tab.id
          const isComing = tab.status === 'coming'

          return (
            <button
              key={tab.id}
              onClick={() => !isComing && onChange(tab.id)}
              disabled={isComing}
              className={`px-3 py-1.5 text-sm border rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-red-50 border-red-600 text-red-600 font-medium'
                  : isComing
                  ? 'border-gray-200 text-gray-400 opacity-40 cursor-not-allowed'
                  : 'border-gray-200 text-gray-800 hover:border-red-600/30 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {tab.label}
                {isComing && <Clock size={12} />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
