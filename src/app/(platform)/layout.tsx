'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { LocaleContext } from '@/hooks/useLocalizedText'
import { ApiProvider, PipelineProvider, ToastProvider, SidebarProvider } from '@/contexts'
import ToastContainer from '@/components/common/Toast'
import Sidebar from '@/components/Navigation/Sidebar'
import SidebarMobileOverlay from '@/components/Navigation/SidebarMobileOverlay'
import PlatformNavbar from '@/components/Navigation/PlatformNavbar'
import Breadcrumb from '@/components/Navigation/Breadcrumb'
import Footer from '@/components/Navigation/Footer'
import type { Locale } from '@/lib/types/i18n'

// 워크스페이스 라우트: Breadcrumb/Footer 숨기고 full-height 적용
const WORKSPACE_ROUTES = [
  '/analysis/sunlight',
  '/analysis/view',
  '/analysis/privacy',
]

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
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
                <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                  <PlatformNavbar />
                  {!isWorkspace && <Breadcrumb />}
                  <main className={`flex-1 bg-white ${isWorkspace ? 'overflow-hidden p-0' : ''}`}>
                    {children}
                  </main>
                  {!isWorkspace && <Footer />}
                </div>
              </div>
              <ToastContainer />
            </SidebarProvider>
          </ToastProvider>
        </PipelineProvider>
      </ApiProvider>
    </LocaleContext.Provider>
  )
}
