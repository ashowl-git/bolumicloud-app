'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useSolarPVPipeline } from '@/components/SolarPVAnalysis/hooks/useSolarPVPipeline'
import type { UseSolarPVPipelineReturn } from '@/components/SolarPVAnalysis/hooks/useSolarPVPipeline'

const SolarPVPipelineContext = createContext<UseSolarPVPipelineReturn | null>(null)

interface SolarPVPipelineProviderProps {
  children: ReactNode
  apiUrl: string
}

export function SolarPVPipelineProvider({ children, apiUrl }: SolarPVPipelineProviderProps) {
  const pipeline = useSolarPVPipeline({ apiUrl })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => pipeline, [
    pipeline.phase,
    pipeline.sessionId,
    pipeline.modelId,
    pipeline.sceneUrl,
    pipeline.progress,
    pipeline.results,
    pipeline.error,
    pipeline.isCancelled,
    pipeline.estimatedRemainingSec,
    pipeline.uploadProgress,
    pipeline.modulePresets,
    pipeline.modelMeta,
    pipeline.importData,
  ])

  return (
    <SolarPVPipelineContext.Provider value={value}>
      {children}
    </SolarPVPipelineContext.Provider>
  )
}

export function useSolarPVPipelineContext(): UseSolarPVPipelineReturn {
  const context = useContext(SolarPVPipelineContext)
  if (!context) {
    throw new Error('useSolarPVPipelineContext must be used within SolarPVPipelineProvider')
  }
  return context
}
