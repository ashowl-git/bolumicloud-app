'use client'

import { motion } from 'framer-motion'
import { ScanEye, ArrowRightLeft, Sparkles, Orbit, ShieldCheck } from 'lucide-react'
import { CATEGORY_LABELS, type Category } from '@/lib/tabConfig'
import { useLocalizedText } from '@/hooks/useLocalizedText'

interface CategoryTabsProps {
  active: Category
  onChange: (category: Category) => void
}

const categories = [
  { id: 'analysis', icon: ScanEye },
  { id: 'convert', icon: ArrowRightLeft },
  { id: 'generate', icon: Sparkles },
  { id: 'simulate', icon: Orbit },
  { id: 'compliance', icon: ShieldCheck }
] as const

export default function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  const { t } = useLocalizedText()

  return (
    <div className="border-b border-gray-200">
      <div className="flex gap-2" role="tablist" aria-label="Main categories">
        {categories.map((cat) => {
          const Icon = cat.icon
          const isActive = active === cat.id

          return (
            <button
              key={cat.id}
              role="tab"
              id={`tab-${cat.id}`}
              aria-selected={isActive}
              aria-controls={`panel-${cat.id}`}
              onClick={() => onChange(cat.id as Category)}
              className={`px-4 py-3 transition-all duration-300 relative ${
                isActive
                  ? 'text-red-600'
                  : 'text-gray-800 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon size={20} strokeWidth={1.5} />
                <span className="text-sm font-medium">{t(CATEGORY_LABELS[cat.id])}</span>
              </div>

              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"
                  transition={{ duration: 0.3 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
