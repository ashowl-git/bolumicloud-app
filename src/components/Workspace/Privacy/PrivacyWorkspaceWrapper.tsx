'use client'

import { useApi } from '@/contexts/ApiContext'
import { PrivacyPipelineProvider } from '@/contexts/PrivacyPipelineContext'
import PrivacyWorkspace from './PrivacyWorkspace'

export default function PrivacyWorkspaceWrapper() {
  const { apiUrl } = useApi()

  return (
    <PrivacyPipelineProvider apiUrl={apiUrl}>
      <PrivacyWorkspace />
    </PrivacyPipelineProvider>
  )
}
