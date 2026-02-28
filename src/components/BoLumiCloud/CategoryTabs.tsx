'use client'

import { motion } from 'framer-motion'
import { ScanEye, ArrowRightLeft, Sparkles, Orbit, ShieldCheck } from 'lucide-react'

type Category = 'analysis' | 'convert' | 'generate' | 'simulate' | 'compliance'

interface CategoryTabsProps {
  active: Category
  onChange: (category: Category) => void
}

const categories = [
  { id: 'analysis', icon: ScanEye, label: '분석' },
  { id: 'convert', icon: ArrowRightLeft, label: '변환' },
  { id: 'generate', icon: Sparkles, label: '생성' },
  { id: 'simulate', icon: Orbit, label: '시뮬레이션' },
  { id: 'compliance', icon: ShieldCheck, label: '법규' }
] as const

export default function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <div className="flex gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon
          const isActive = active === cat.id

          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id as Category)}
              className={`px-4 py-3 transition-all duration-300 relative ${
                isActive
                  ? 'text-red-600'
                  : 'text-gray-800 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon size={20} strokeWidth={1.5} />
                <span className="text-sm font-medium">{cat.label}</span>
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
