'use client'

import { type ReactNode } from 'react'
import { X, PanelRightClose } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface WorkspaceSidePanelProps {
  title: string
  open: boolean
  onClose: () => void
  onOpen: () => void
  children: ReactNode
  footer?: ReactNode
}

export default function WorkspaceSidePanel({
  title,
  open,
  onClose,
  onOpen,
  children,
  footer,
}: WorkspaceSidePanelProps) {
  return (
    <>
      {/* Collapsed toggle button */}
      {!open && (
        <button
          onClick={onOpen}
          className="absolute top-4 right-4 z-20 p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md
            border border-gray-200/80 dark:border-slate-700/80 hover:border-gray-400 dark:hover:border-slate-500 hover:bg-white/95 dark:hover:bg-slate-800
            shadow-sm transition-all duration-200"
          title="패널 열기 (Tab)"
        >
          <PanelRightClose size={18} className="text-gray-600 dark:text-slate-300" />
        </button>
      )}

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-[400px] h-full flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg
              border-l border-gray-200/60 dark:border-slate-700/60 shadow-[-4px_0_24px_rgba(0,0,0,0.08)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/80 dark:border-slate-700/80 flex-shrink-0">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100 tracking-tight">{title}</h2>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                title="패널 닫기 (Tab)"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {children}
            </div>

            {/* Fixed Footer */}
            {footer && (
              <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
                {footer}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
