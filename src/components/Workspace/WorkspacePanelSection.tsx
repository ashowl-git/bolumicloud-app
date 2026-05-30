'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface WorkspacePanelSectionProps {
  title: string
  icon?: ReactNode
  defaultOpen?: boolean
  badge?: string | number
  children: ReactNode
}

export default function WorkspacePanelSection({
  title,
  icon,
  defaultOpen = true,
  badge,
  children,
}: WorkspacePanelSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    defaultOpen ? undefined : 0
  )

  useEffect(() => {
    if (!contentRef.current) return
    if (isOpen) {
      const h = contentRef.current.scrollHeight
      setContentHeight(h)
      // After transition, switch to auto so dynamic content works
      const timer = setTimeout(() => setContentHeight(undefined), 250)
      return () => clearTimeout(timer)
    } else {
      // Set explicit height first so transition can animate from it
      const h = contentRef.current.scrollHeight
      setContentHeight(h)
      // Force reflow, then set to 0
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setContentHeight(0))
      })
    }
  }, [isOpen])

  return (
    <div className="border border-gray-200/80 dark:border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2
          transition-colors duration-150 ${
            isOpen ? 'bg-gray-50/80 dark:bg-slate-800/80' : 'hover:bg-gray-50/60 dark:hover:bg-slate-800/60'
          }`}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-400 dark:text-slate-500">{icon}</span>}
          <span className="text-[11px] font-semibold text-gray-800 dark:text-slate-200 uppercase tracking-wider">
            {title}
          </span>
          {badge !== undefined && (
            <span className="text-[10px] font-medium text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700
              px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-400 dark:text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>

      {/* Animated content */}
      <div
        ref={contentRef}
        style={{ maxHeight: contentHeight === undefined ? 'none' : `${contentHeight}px` }}
        className="transition-[max-height,opacity] duration-250 ease-in-out overflow-hidden"
        aria-hidden={!isOpen}
      >
        <div className={`px-3 pb-3 pt-2 border-t border-gray-100 dark:border-slate-700 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}>
          {children}
        </div>
      </div>
    </div>
  )
}
