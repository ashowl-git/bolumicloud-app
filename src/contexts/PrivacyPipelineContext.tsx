'use client'

import { createContext, useContext, useMemo } from 'react'
import { usePrivacyPipeline, type UsePrivacyPipelineReturn } from '@/components/PrivacyAnalysis/hooks/usePrivacyPipeline'

const PrivacyPipelineContext = createContext<UsePrivacyPipelineReturn | null>(null)

export function PrivacyPipelineProvider({ apiUrl, children }: { apiUrl: string; children: React.ReactNode }) {
  const pipeline = usePrivacyPipeline(apiUrl)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => pipeline, [
    pipeline.phase,
    pipeline.sessionId,
    pipeline.sceneUrl,
    pipeline.config,
    pipeline.progress,
    pipeline.results,
    pipeline.error,
    pipeline.isCancelled,
  ])

  return <PrivacyPipelineContext.Provider value={value}>{children}</PrivacyPipelineContext.Provider>
}

export function usePrivacyPipelineContext(): UsePrivacyPipelineReturn {
  const ctx = useContext(PrivacyPipelineContext)
  if (!ctx) throw new Error('usePrivacyPipelineContext must be used within PrivacyPipelineProvider')
  return ctx
}
