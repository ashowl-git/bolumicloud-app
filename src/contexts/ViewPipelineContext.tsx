'use client'

import { useViewPipeline } from '@/components/ViewAnalysis/hooks/useViewPipeline'
import type { ViewPipelinePhase } from '@/components/ViewAnalysis/hooks/useViewPipeline'
import { createPipelineContext } from './createPipelineContext'

const { Provider: ViewPipelineProvider, usePipelineContext: useViewPipelineContext } =
  createPipelineContext(
    'View',
    (apiUrl) => useViewPipeline({ apiUrl }),
    (p) => [
      p.phase, p.sessionId, p.sceneUrl, p.modelMeta,
      p.progress, p.results, p.error, p.isCancelled, p.estimatedRemainingSec,
    ],
  )

export { ViewPipelineProvider, useViewPipelineContext }
export type { ViewPipelinePhase }
