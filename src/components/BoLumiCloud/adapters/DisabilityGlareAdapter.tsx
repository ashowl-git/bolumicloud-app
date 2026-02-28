'use client'

import { usePipelineContext } from '@/contexts/PipelineContext'
import DisabilityGlare from '@/components/BoLumiCloud/DisabilityGlare'

export default function DisabilityGlareAdapter() {
  const { results: pipelineResults } = usePipelineContext()
  return <DisabilityGlare results={pipelineResults?.results || []} />
}
