'use client'

import { useApi } from '@/contexts/ApiContext'
import { PrivacyPipelineProvider } from '@/contexts/PrivacyPipelineContext'
import PrivacyPipelineTab from './PrivacyPipelineTab'

export default function PrivacyPipelineWrapper() {
  const { apiUrl } = useApi()

  return (
    <PrivacyPipelineProvider apiUrl={apiUrl}>
      <PrivacyPipelineTab />
    </PrivacyPipelineProvider>
  )
}
