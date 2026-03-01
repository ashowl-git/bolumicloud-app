'use client'

import { useApi } from '@/contexts/ApiContext'
import { ViewPipelineProvider } from '@/contexts/ViewPipelineContext'
import ViewPipelineTab from './ViewPipelineTab'

export default function ViewPipelineWrapper() {
  const { apiUrl } = useApi()

  return (
    <ViewPipelineProvider apiUrl={apiUrl}>
      <ViewPipelineTab />
    </ViewPipelineProvider>
  )
}
