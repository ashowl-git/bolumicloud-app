'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import BoLumiCloudMark from '@/components/BoLumiCloud/BoLumiCloudMark'
import SidebarSection from './SidebarSection'
import { NAVIGATION } from '@/lib/navigationConfig'

export default function SidebarMobileOverlay() {
  const { isMobileOpen, setIsMobileOpen } = useSidebar()
  const drawerRef = useRef<HTMLElement>(null)
  useFocusTrap(drawerRef, isMobileOpen)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false)
    }
    if (isMobileOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isMobileOpen, setIsMobileOpen])

  return (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden fixed inset-0 bg-black/30 z-40"
          />

          {/* Drawer */}
          <motion.aside
            ref={drawerRef}
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="md:hidden fixed top-0 left-0 w-[280px] h-screen bg-white z-50 flex flex-col shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <Link href="/" className="flex items-center gap-2.5" onClick={() => setIsMobileOpen(false)}>
                <BoLumiCloudMark size={24} className="text-slate-900" />
                <span className="text-lg font-normal tracking-wide text-slate-900">
                  B<span className="text-red-600">o</span>LumiCloud<span className="text-red-600">.</span>
                </span>
              </Link>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3">
              {NAVIGATION.map((section) => (
                <SidebarSection
                  key={section.id}
                  section={section}
                  onNavigate={() => setIsMobileOpen(false)}
                />
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
