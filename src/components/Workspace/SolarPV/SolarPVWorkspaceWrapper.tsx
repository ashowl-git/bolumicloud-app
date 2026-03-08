'use client'

import { useApi } from '@/contexts/ApiContext'
import { SolarPVPipelineProvider } from '@/contexts/SolarPVPipelineContext'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import SolarPVWorkspace from './SolarPVWorkspace'

export default function SolarPVWorkspaceWrapper() {
  const { apiUrl } = useApi()

  return (
    <ErrorBoundary>
      <SolarPVPipelineProvider apiUrl={apiUrl}>
        <SolarPVWorkspace />
      </SolarPVPipelineProvider>
    </ErrorBoundary>
  )
}
