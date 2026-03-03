'use client'

import { useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { LocaleContext } from '@/hooks/useLocalizedText'
import { ApiProvider, PipelineProvider, ToastProvider, SidebarProvider } from '@/contexts'
import { useSidebar } from '@/contexts/SidebarContext'
import ToastContainer from '@/components/common/Toast'
import Sidebar from '@/components/Navigation/Sidebar'
import SidebarMobileOverlay from '@/components/Navigation/SidebarMobileOverlay'
import PlatformNavbar from '@/components/Navigation/PlatformNavbar'
import Breadcrumb from '@/components/Navigation/Breadcrumb'
import Footer from '@/components/Navigation/Footer'
import type { Locale } from '@/lib/types/i18n'

const WORKSPACE_ROUTES = [
  '/analysis/sunlight',
  '/analysis/view',
  '/analysis/privacy',
]

function MainContent({ children, isWorkspace }: { children: ReactNode; isWorkspace: boolean }) {
  const { isOpen } = useSidebar()

  return (
    <div
      className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-200 ease-in-out
        ${isOpen ? 'md:ml-64' : 'md:ml-16'}`}
    >
      <PlatformNavbar />
      {!isWorkspace && <Breadcrumb />}
      <main className={`flex-1 bg-white ${isWorkspace ? 'overflow-hidden p-0' : ''}`}>
        {children}
      </main>
      {!isWorkspace && <Footer />}
    </div>
  )
}

export default function PlatformLayout({
  children,
}: {
  children: ReactNode
}) {
  const [locale, setLocale] = useState<Locale>('ko')
  const pathname = usePathname()
  const isWorkspace = WORKSPACE_ROUTES.some((route) => pathname?.endsWith(route))

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <ApiProvider>
        <PipelineProvider>
          <ToastProvider>
            <SidebarProvider>
              <div className="flex min-h-screen">
                <Sidebar />
                <SidebarMobileOverlay />
                <MainContent isWorkspace={isWorkspace}>
                  {children}
                </MainContent>
              </div>
              <ToastContainer />
            </SidebarProvider>
          </ToastProvider>
        </PipelineProvider>
      </ApiProvider>
    </LocaleContext.Provider>
  )
}
