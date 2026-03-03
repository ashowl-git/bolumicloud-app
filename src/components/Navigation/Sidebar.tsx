'use client'

import Link from 'next/link'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import BoLumiCloudMark from '@/components/BoLumiCloud/BoLumiCloudMark'
import SidebarSection from './SidebarSection'
import { NAVIGATION } from '@/lib/navigationConfig'

export default function Sidebar() {
  const { isOpen, setIsOpen } = useSidebar()

  return (
    <aside
      className={`hidden md:flex fixed top-0 left-0 h-screen flex-col bg-white border-r border-gray-200 z-40
        transition-[width] duration-200 ease-in-out
        ${isOpen ? 'w-64' : 'w-16'}`}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-gray-100 ${isOpen ? 'gap-2.5 px-5 py-4' : 'justify-center py-4'}`}>
        <Link href="/" className="flex items-center gap-2.5">
          <BoLumiCloudMark size={24} className="text-slate-900 flex-shrink-0" />
          {isOpen && (
            <span className="text-lg font-normal tracking-wide text-slate-900 whitespace-nowrap">
              B<span className="text-red-600">o</span>LumiCloud<span className="text-red-600">.</span>
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3" aria-label="Main navigation">
        {NAVIGATION.map((section) => (
          <SidebarSection key={section.id} section={section} collapsed={!isOpen} />
        ))}
      </nav>

      {/* Bottom: collapse toggle + version */}
      <div className={`border-t border-gray-100 ${isOpen ? 'px-3 py-2' : 'px-2 py-2'}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 w-full text-gray-400 hover:text-gray-700 transition-colors duration-150
            ${isOpen ? 'px-2 py-2' : 'justify-center py-2'}`}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          {isOpen && <span className="text-xs">Collapse</span>}
        </button>
        {isOpen && (
          <p className="text-[10px] text-gray-400 px-2 mt-1">v0.3.0</p>
        )}
      </div>
    </aside>
  )
}
