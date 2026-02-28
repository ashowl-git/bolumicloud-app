'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useApi } from './ApiContext'
import { usePipeline, type PipelinePhase } from '@/components/BoLumiCloud/hooks/usePipeline'
import type { AnalysisResponse } from '@/lib/types/glare'
import type { PipelineConfig, PipelineProgress } from '@/lib/types/pipeline'

interface PipelineContextType {
  phase: PipelinePhase
  sessionId: string | null
  vfCount: number
  progress: PipelineProgress | null
  results: AnalysisResponse | null
  error: string | null
  isCancelled: boolean
  estimatedRemainingSec: number | null

  uploadFiles: (vfFiles: File[], objFile: File, mtlFile: File | null) => Promise<void>
  runPipeline: (config: PipelineConfig) => Promise<void>
  cancelPipeline: () => Promise<void>
  reset: () => void
  resetForRerun: () => void
}

const PipelineContext = createContext<PipelineContextType | null>(null)

interface PipelineProviderProps {
  children: ReactNode
}

export function PipelineProvider({ children }: PipelineProviderProps) {
  const { apiUrl } = useApi()
  const pipeline = usePipeline({ apiUrl })

  const value = useMemo<PipelineContextType>(
    () => ({
      phase: pipeline.phase,
      sessionId: pipeline.sessionId,
      vfCount: pipeline.vfCount,
      progress: pipeline.progress,
      results: pipeline.results,
      error: pipeline.error,
      isCancelled: pipeline.isCancelled,
      estimatedRemainingSec: pipeline.estimatedRemainingSec,
      uploadFiles: pipeline.uploadFiles,
      runPipeline: pipeline.runPipeline,
      cancelPipeline: pipeline.cancelPipeline,
      reset: pipeline.reset,
      resetForRerun: pipeline.resetForRerun,
    }),
    [
      pipeline.phase,
      pipeline.sessionId,
      pipeline.vfCount,
      pipeline.progress,
      pipeline.results,
      pipeline.error,
      pipeline.isCancelled,
      pipeline.estimatedRemainingSec,
      pipeline.uploadFiles,
      pipeline.runPipeline,
      pipeline.cancelPipeline,
      pipeline.reset,
      pipeline.resetForRerun,
    ]
  )

  return (
    <PipelineContext.Provider value={value}>
      {children}
    </PipelineContext.Provider>
  )
}

export function usePipelineContext(): PipelineContextType {
  const context = useContext(PipelineContext)

  if (!context) {
    throw new Error('usePipelineContext must be used within a PipelineProvider')
  }

  return context
}
