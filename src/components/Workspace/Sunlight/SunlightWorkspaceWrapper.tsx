'use client'

import { useApi } from '@/contexts/ApiContext'
import { SunlightPipelineProvider } from '@/contexts/SunlightPipelineContext'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import SunlightWorkspace from './SunlightWorkspace'

export default function SunlightWorkspaceWrapper() {
  const { apiUrl } = useApi()

  return (
    <ErrorBoundary>
      <SunlightPipelineProvider apiUrl={apiUrl}>
        <SunlightWorkspace />
      </SunlightPipelineProvider>
    </ErrorBoundary>
  )
}
