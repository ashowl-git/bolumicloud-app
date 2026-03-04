'use client'

import { useApi } from '@/contexts/ApiContext'
import { ViewPipelineProvider } from '@/contexts/ViewPipelineContext'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import ViewWorkspace from './ViewWorkspace'

export default function ViewWorkspaceWrapper() {
  const { apiUrl } = useApi()

  return (
    <ErrorBoundary>
      <ViewPipelineProvider apiUrl={apiUrl}>
        <ViewWorkspace />
      </ViewPipelineProvider>
    </ErrorBoundary>
  )
}
