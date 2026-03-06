'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useViewPipeline } from '@/components/ViewAnalysis/hooks/useViewPipeline'
import type { ViewPipelinePhase, UseViewPipelineReturn } from '@/components/ViewAnalysis/hooks/useViewPipeline'

const ViewPipelineContext = createContext<UseViewPipelineReturn | null>(null)

interface ViewPipelineProviderProps {
  children: ReactNode
  apiUrl: string
}

export function ViewPipelineProvider({ children, apiUrl }: ViewPipelineProviderProps) {
  const pipeline = useViewPipeline({ apiUrl })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => pipeline, [
    pipeline.phase,
    pipeline.sessionId,
    pipeline.sceneUrl,
    pipeline.modelMeta,
    pipeline.progress,
    pipeline.results,
    pipeline.error,
    pipeline.isCancelled,
    pipeline.estimatedRemainingSec,
  ])

  return (
    <ViewPipelineContext.Provider value={value}>
      {children}
    </ViewPipelineContext.Provider>
  )
}

export function useViewPipelineContext(): UseViewPipelineReturn {
  const context = useContext(ViewPipelineContext)
  if (!context) {
    throw new Error('useViewPipelineContext must be used within ViewPipelineProvider')
  }
  return context
}

export type { ViewPipelinePhase }
