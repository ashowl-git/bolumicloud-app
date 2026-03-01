'use client'

import { useApi } from '@/contexts/ApiContext'
import { SunlightPipelineProvider } from '@/contexts/SunlightPipelineContext'
import SunlightPipelineTab from './SunlightPipelineTab'

export default function SunlightPipelineWrapper() {
  const { apiUrl } = useApi()

  return (
    <SunlightPipelineProvider apiUrl={apiUrl}>
      <SunlightPipelineTab />
    </SunlightPipelineProvider>
  )
}
