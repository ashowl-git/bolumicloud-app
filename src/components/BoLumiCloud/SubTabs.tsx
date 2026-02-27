'use client'

interface SubTabsProps {
  tabs: { id: string; label: string; status?: 'active' | 'coming' }[]
  active: string
  onChange: (tab: string) => void
}

export default function SubTabs({ tabs, active, onChange }: SubTabsProps) {
  return (
    <div className="py-3 border-b border-gray-200">
      <div className="flex gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => tab.status !== 'coming' && onChange(tab.id)}
            disabled={tab.status === 'coming'}
            className={`text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              active === tab.id
                ? 'text-red-600 font-medium'
                : 'text-gray-800 hover:text-gray-900'
            }`}
          >
            • {tab.label}
            {tab.status === 'coming' && (
              <span className="ml-2 text-xs text-gray-700">(준비 중)</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
