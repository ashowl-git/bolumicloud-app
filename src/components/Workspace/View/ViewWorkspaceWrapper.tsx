'use client'

import { useApi } from '@/contexts/ApiContext'
import { ViewPipelineProvider } from '@/contexts/ViewPipelineContext'
import ViewWorkspace from './ViewWorkspace'

export default function ViewWorkspaceWrapper() {
  const { apiUrl } = useApi()

  return (
    <ViewPipelineProvider apiUrl={apiUrl}>
      <ViewWorkspace />
    </ViewPipelineProvider>
  )
}
