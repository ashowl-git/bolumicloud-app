'use client'

import { memo } from 'react'
import type { SolarPVResult, SolarPVProgress } from '@/lib/types/solar-pv'
import type { SolarPVModelMeta } from '@/components/SolarPVAnalysis/hooks/useSolarPVPipeline'
import { useStatusBarState } from '@/hooks/useStatusBarState'
import { formatDuration, formatEta } from '@/lib/utils/format'
import WorkspaceStatusBar from '../WorkspaceStatusBar'

interface SolarPVStatusBarContainerProps {
  phase: string
  error: string | null
  progress: SolarPVProgress | null
  results: SolarPVResult | null
  estimatedRemainingSec: number | null
  modelMeta: SolarPVModelMeta | null | undefined
  onViewResults: () => void
  onRetry: () => void
  onReset: () => void
  onCancel: () => void
}

function SolarPVStatusBarContainer({
  phase,
  error,
  progress,
  results,
  estimatedRemainingSec,
  modelMeta,
  onViewResults,
  onRetry,
  onReset,
  onCancel,
}: SolarPVStatusBarContainerProps) {
  const statusBarState = useStatusBarState({ phase, error })

  const stageName = progress?.stages.find((s) => s.status === 'processing')?.name

  return (
    <WorkspaceStatusBar
      state={statusBarState}
      modelInfo={modelMeta
        ? `${modelMeta.original_name} | V: ${modelMeta.vertices.toLocaleString()} F: ${modelMeta.faces.toLocaleString()}`
        : undefined}
      stageName={stageName}
      analysisProgress={progress?.overall_progress}
      etaText={estimatedRemainingSec ? formatEta(estimatedRemainingSec) : undefined}
      completionTime={results?.metadata?.computation_time_sec
        ? `${formatDuration(results.metadata.computation_time_sec as number)}`
        : undefined}
      errorMessage={error || undefined}
      onViewResults={onViewResults}
      onRetry={onRetry}
      onReset={onReset}
      onCancel={onCancel}
    />
  )
}

export default memo(SolarPVStatusBarContainer)
