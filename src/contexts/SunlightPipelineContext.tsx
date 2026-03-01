'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useSunlightPipeline } from '@/components/SunlightAnalysis/hooks/useSunlightPipeline'
import type { SunlightPipelinePhase, UseSunlightPipelineReturn } from '@/components/SunlightAnalysis/hooks/useSunlightPipeline'

const SunlightPipelineContext = createContext<UseSunlightPipelineReturn | null>(null)

interface SunlightPipelineProviderProps {
  children: ReactNode
  analysisApiUrl: string
}

export function SunlightPipelineProvider({ children, analysisApiUrl }: SunlightPipelineProviderProps) {
  const pipeline = useSunlightPipeline({ apiUrl: analysisApiUrl })

  const value = useMemo(() => pipeline, [pipeline])

  return (
    <SunlightPipelineContext.Provider value={value}>
      {children}
    </SunlightPipelineContext.Provider>
  )
}

export function useSunlightPipelineContext(): UseSunlightPipelineReturn {
  const context = useContext(SunlightPipelineContext)
  if (!context) {
    throw new Error('useSunlightPipelineContext must be used within SunlightPipelineProvider')
  }
  return context
}

export type { SunlightPipelinePhase }
