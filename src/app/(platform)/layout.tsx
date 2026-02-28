'use client'

import { useState } from 'react'
import { LocaleContext } from '@/hooks/useLocalizedText'
import { ApiProvider, PipelineProvider, ToastProvider, SidebarProvider } from '@/contexts'
import ToastContainer from '@/components/common/Toast'
import Sidebar from '@/components/Navigation/Sidebar'
import SidebarMobileOverlay from '@/components/Navigation/SidebarMobileOverlay'
import PlatformNavbar from '@/components/Navigation/PlatformNavbar'
import Breadcrumb from '@/components/Navigation/Breadcrumb'
import Footer from '@/components/Navigation/Footer'
import type { Locale } from '@/lib/types/i18n'

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [locale, setLocale] = useState<Locale>('ko')

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
                  <Breadcrumb />
                  <main className="flex-1 bg-white">
                    {children}
                  </main>
                  <Footer />
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
