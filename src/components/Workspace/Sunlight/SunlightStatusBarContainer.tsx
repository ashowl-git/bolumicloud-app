'use client'

import { memo } from 'react'
import { useStatusBarState } from '@/hooks/useStatusBarState'
import { formatDuration, formatEta } from '@/lib/utils/format'
import WorkspaceStatusBar from '../WorkspaceStatusBar'
import type { SunlightAnalysisResult, SunlightProgress } from '@/lib/types/sunlight'
import type { SunlightPipelinePhase } from '@/contexts/SunlightPipelineContext'

// ── Types ──────────────────────────────────────────────────────────────────

export interface SunlightStatusBarContainerProps {
  phase: SunlightPipelinePhase
  error: string | null
  progress: SunlightProgress | null
  results: SunlightAnalysisResult | null
  estimatedRemainingSec: number | null
  modelMeta: { original_name: string; vertices: number; faces: number } | null
  onViewResults: () => void
  onRetry: () => void
  onReset: () => void
  onCancel: () => void
}

// ── Component ──────────────────────────────────────────────────────────────

function SunlightStatusBarContainer({
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
}: SunlightStatusBarContainerProps) {
  const statusBarState = useStatusBarState({ phase, error })

  const modelInfo = modelMeta
    ? `${modelMeta.original_name} | V: ${modelMeta.vertices.toLocaleString()} F: ${modelMeta.faces.toLocaleString()}`
    : undefined

  const stageName = progress?.stages.find((s) => s.status === 'processing')?.name

  return (
    <WorkspaceStatusBar
      state={statusBarState}
      modelInfo={modelInfo}
      stageName={stageName}
      analysisProgress={progress?.overall_progress}
      etaText={estimatedRemainingSec ? formatEta(estimatedRemainingSec) : undefined}
      completionTime={results ? `${formatDuration(results.metadata.computation_time_sec)}` : undefined}
      errorMessage={error || undefined}
      onViewResults={onViewResults}
      onRetry={onRetry}
      onReset={onReset}
      onCancel={onCancel}
    />
  )
}

export default memo(SunlightStatusBarContainer)
