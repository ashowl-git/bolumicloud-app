'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface SidebarContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

const STORAGE_KEY = 'sidebarOpen'

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpenState] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setIsOpenState(stored === 'true')
    }
  }, [])

  const setIsOpen = (open: boolean) => {
    setIsOpenState(open)
    localStorage.setItem(STORAGE_KEY, String(open))
  }

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isMobileOpen, setIsMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar(): SidebarContextType {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
