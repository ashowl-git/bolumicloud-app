'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import SidebarLink from './SidebarLink'
import type { SectionConfig } from '@/lib/types/navigation'

interface SidebarSectionProps {
  section: SectionConfig
  onNavigate?: () => void
}

export default function SidebarSection({ section, onNavigate }: SidebarSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const { t } = useLocalizedText()
  const Icon = section.icon

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
      >
        <Icon size={14} strokeWidth={1.5} />
        <span className="flex-1 text-left">{t(section.name)}</span>
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pl-2">
              {section.modules.map((mod) => (
                <SidebarLink
                  key={mod.id}
                  module={mod}
                  basePath={section.basePath}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
