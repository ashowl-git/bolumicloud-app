'use client'

import { createContext, useContext } from 'react'
import { usePerformanceGrade, type UsePerformanceGradeReturn } from '@/components/PerformanceGrade/hooks/usePerformanceGrade'

const PerformanceGradeContext = createContext<UsePerformanceGradeReturn | null>(null)

export function PerformanceGradeProvider({ apiUrl, children }: { apiUrl: string; children: React.ReactNode }) {
  const value = usePerformanceGrade(apiUrl)
  return <PerformanceGradeContext.Provider value={value}>{children}</PerformanceGradeContext.Provider>
}

export function usePerformanceGradeContext(): UsePerformanceGradeReturn {
  const ctx = useContext(PerformanceGradeContext)
  if (!ctx) throw new Error('usePerformanceGradeContext must be used within PerformanceGradeProvider')
  return ctx
}
