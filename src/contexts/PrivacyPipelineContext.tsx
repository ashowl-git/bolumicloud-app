'use client'

import { createContext, useContext } from 'react'
import { usePrivacyPipeline, type UsePrivacyPipelineReturn } from '@/components/PrivacyAnalysis/hooks/usePrivacyPipeline'

const PrivacyPipelineContext = createContext<UsePrivacyPipelineReturn | null>(null)

export function PrivacyPipelineProvider({ apiUrl, children }: { apiUrl: string; children: React.ReactNode }) {
  const value = usePrivacyPipeline(apiUrl)
  return <PrivacyPipelineContext.Provider value={value}>{children}</PrivacyPipelineContext.Provider>
}

export function usePrivacyPipelineContext(): UsePrivacyPipelineReturn {
  const ctx = useContext(PrivacyPipelineContext)
  if (!ctx) throw new Error('usePrivacyPipelineContext must be used within PrivacyPipelineProvider')
  return ctx
}
