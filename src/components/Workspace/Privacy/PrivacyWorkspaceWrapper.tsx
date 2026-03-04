'use client'

import { useApi } from '@/contexts/ApiContext'
import { PrivacyPipelineProvider } from '@/contexts/PrivacyPipelineContext'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import PrivacyWorkspace from './PrivacyWorkspace'

export default function PrivacyWorkspaceWrapper() {
  const { apiUrl } = useApi()

  return (
    <ErrorBoundary>
      <PrivacyPipelineProvider apiUrl={apiUrl}>
        <PrivacyWorkspace />
      </PrivacyPipelineProvider>
    </ErrorBoundary>
  )
}
