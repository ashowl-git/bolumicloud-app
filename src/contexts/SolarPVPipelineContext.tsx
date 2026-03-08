'use client'

import { useSolarPVPipeline } from '@/components/SolarPVAnalysis/hooks/useSolarPVPipeline'
import { createPipelineContext } from './createPipelineContext'

const { Provider: SolarPVPipelineProvider, usePipelineContext: useSolarPVPipelineContext } =
  createPipelineContext(
    'SolarPV',
    (apiUrl) => useSolarPVPipeline({ apiUrl }),
    (p) => [
      p.phase, p.sessionId, p.modelId, p.sceneUrl,
      p.progress, p.results, p.error, p.isCancelled,
      p.estimatedRemainingSec, p.uploadProgress, p.modulePresets, p.modelMeta, p.importData,
    ],
  )

export { SolarPVPipelineProvider, useSolarPVPipelineContext }
