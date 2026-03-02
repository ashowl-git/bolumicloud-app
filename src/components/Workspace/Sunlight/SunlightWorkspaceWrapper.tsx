'use client'

import { useApi } from '@/contexts/ApiContext'
import { SunlightPipelineProvider } from '@/contexts/SunlightPipelineContext'
import SunlightWorkspace from './SunlightWorkspace'

export default function SunlightWorkspaceWrapper() {
  const { apiUrl } = useApi()

  return (
    <SunlightPipelineProvider apiUrl={apiUrl}>
      <SunlightWorkspace />
    </SunlightPipelineProvider>
  )
}
