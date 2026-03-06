'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useSunlightPipeline } from '@/components/SunlightAnalysis/hooks/useSunlightPipeline'
import type { SunlightPipelinePhase, UseSunlightPipelineReturn } from '@/components/SunlightAnalysis/hooks/useSunlightPipeline'

const SunlightPipelineContext = createContext<UseSunlightPipelineReturn | null>(null)

interface SunlightPipelineProviderProps {
  children: ReactNode
  apiUrl: string
}

export function SunlightPipelineProvider({ children, apiUrl }: SunlightPipelineProviderProps) {
  const pipeline = useSunlightPipeline({ apiUrl })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => pipeline, [
    pipeline.phase,
    pipeline.sessionId,
    pipeline.modelId,
    pipeline.sceneUrl,
    pipeline.modelMeta,
    pipeline.progress,
    pipeline.results,
    pipeline.error,
    pipeline.isCancelled,
    pipeline.estimatedRemainingSec,
    pipeline.importData,
    pipeline.windowPoints,
    pipeline.uploadFile,
    pipeline.runAnalysis,
    pipeline.cancelAnalysis,
    pipeline.reset,
  ])

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
