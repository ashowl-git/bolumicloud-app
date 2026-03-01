'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useBackendHealth, type BackendStatus, type BackendInfo } from '@/components/BoLumiCloud/hooks/useBackendHealth'

interface ApiContextType {
  apiUrl: string
  backendStatus: BackendStatus
  backendInfo: BackendInfo | null
}

const ApiContext = createContext<ApiContextType | null>(null)

interface ApiProviderProps {
  children: ReactNode
  apiUrl?: string
}

export function ApiProvider({ children, apiUrl }: ApiProviderProps) {
  const resolvedApiUrl = apiUrl || process.env.NEXT_PUBLIC_API_URL || 'https://api.askwhy.works'

  const { backendStatus, backendInfo } = useBackendHealth(resolvedApiUrl)

  const value = useMemo<ApiContextType>(
    () => ({
      apiUrl: resolvedApiUrl,
      backendStatus,
      backendInfo,
    }),
    [resolvedApiUrl, backendStatus, backendInfo]
  )

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>
}

export function useApi(): ApiContextType {
  const context = useContext(ApiContext)

  if (!context) {
    throw new Error('useApi must be used within an ApiProvider')
  }

  return context
}

export type { BackendStatus, BackendInfo }
