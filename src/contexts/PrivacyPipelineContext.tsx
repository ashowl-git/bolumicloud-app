'use client'

import { usePrivacyPipeline } from '@/components/PrivacyAnalysis/hooks/usePrivacyPipeline'
import { createPipelineContext } from './createPipelineContext'

const { Provider: PrivacyPipelineProvider, usePipelineContext: usePrivacyPipelineContext } =
  createPipelineContext(
    'Privacy',
    (apiUrl) => usePrivacyPipeline(apiUrl),
    (p) => [
      p.phase, p.sessionId, p.sceneUrl, p.config,
      p.progress, p.results, p.error, p.isCancelled,
    ],
  )

export { PrivacyPipelineProvider, usePrivacyPipelineContext }
