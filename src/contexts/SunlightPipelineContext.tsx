'use client'

import { useSunlightPipeline } from '@/components/SunlightAnalysis/hooks/useSunlightPipeline'
import type { SunlightPipelinePhase } from '@/components/SunlightAnalysis/hooks/useSunlightPipeline'
import { createPipelineContext } from './createPipelineContext'

const { Provider: SunlightPipelineProvider, usePipelineContext: useSunlightPipelineContext } =
  createPipelineContext(
    'Sunlight',
    (apiUrl) => useSunlightPipeline({ apiUrl }),
    (p) => [
      p.phase, p.sessionId, p.modelId, p.sceneUrl, p.modelMeta,
      p.progress, p.results, p.error, p.isCancelled,
      p.estimatedRemainingSec, p.importData, p.uploadProgress, p.windowPoints,
    ],
  )

export { SunlightPipelineProvider, useSunlightPipelineContext }
export type { SunlightPipelinePhase }
