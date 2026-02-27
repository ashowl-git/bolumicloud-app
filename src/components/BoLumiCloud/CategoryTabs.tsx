'use client'

import { motion } from 'framer-motion'

type Category = 'analysis' | 'convert' | 'generate' | 'simulate' | 'compliance'

interface CategoryTabsProps {
  active: Category
  onChange: (category: Category) => void
}

// 미니멀 SVG 아이콘 (파비콘 스타일 일관성 - 정제된 선)
const IconAnalysis = ({ active }: { active: boolean }) => (
  <svg width="35" height="35" viewBox="0 0 24 24" fill="none">
    <line x1="12" y1="6" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={active ? 'text-red-600' : 'text-gray-800'} />
    <line x1="12" y1="12" x2="8" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="12" y1="12" x2="16" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const IconConvert = ({ active }: { active: boolean }) => (
  <svg width="35" height="35" viewBox="0 0 24 24" fill="none">
    <line x1="8" y1="8" x2="8" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="16" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={active ? 'text-red-600' : 'text-gray-800'} />
    <path d="M10 12 L14 12 M13 10 L15 12 L13 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconGenerate = ({ active }: { active: boolean }) => (
  <svg width="35" height="35" viewBox="0 0 24 24" fill="none">
    <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={active ? 'text-red-600' : 'text-gray-800'} />
  </svg>
)

const IconSimulate = ({ active }: { active: boolean }) => (
  <svg width="35" height="35" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" className={active ? 'text-red-600' : 'text-gray-800'} />
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
)

const IconCompliance = ({ active }: { active: boolean }) => (
  <svg width="35" height="35" viewBox="0 0 24 24" fill="none">
    <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="10" y1="10" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={active ? 'text-red-600' : 'text-gray-800'} />
    <line x1="14" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const categories = [
  { id: 'analysis', icon: IconAnalysis, label: '분석', sublabel: 'Analyze' },
  { id: 'convert', icon: IconConvert, label: '변환', sublabel: 'Convert' },
  { id: 'generate', icon: IconGenerate, label: '생성', sublabel: 'Generate' },
  { id: 'simulate', icon: IconSimulate, label: '시뮬레이션', sublabel: 'Simulate' },
  { id: 'compliance', icon: IconCompliance, label: '법규', sublabel: 'Compliance' }
] as const

export default function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <div className="flex gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id as Category)}
            className={`px-6 py-4 transition-all duration-300 relative ${
              active === cat.id
                ? 'text-gray-900'
                : 'text-gray-800 hover:text-gray-900'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <cat.icon active={active === cat.id} />
              <span className="text-sm font-medium">{cat.label}</span>
              <span className="text-xs text-gray-800">{cat.sublabel}</span>
            </div>

            {active === cat.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"
                transition={{ duration: 0.3 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
