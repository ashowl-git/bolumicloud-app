'use client'

import Link from 'next/link'
import BoLumiCloudMark from '@/components/BoLumiCloud/BoLumiCloudMark'
import SidebarSection from './SidebarSection'
import { NAVIGATION } from '@/lib/navigationConfig'

export default function Sidebar() {
  return (
    <aside className="hidden md:flex fixed top-0 left-0 w-64 h-screen flex-col bg-white border-r border-gray-200 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2.5">
          <BoLumiCloudMark size={24} className="text-slate-900" />
          <span className="text-lg font-normal tracking-wide text-slate-900">
            B<span className="text-red-600">o</span>LumiCloud<span className="text-red-600">.</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        {NAVIGATION.map((section) => (
          <SidebarSection key={section.id} section={section} />
        ))}
      </nav>

      {/* Version */}
      <div className="px-5 py-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400">v0.3.0</p>
      </div>
    </aside>
  )
}
