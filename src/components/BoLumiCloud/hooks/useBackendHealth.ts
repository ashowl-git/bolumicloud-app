'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

export interface BackendInfo {
  pyradiance_version?: string
  cpu_count?: number
  status?: string
}

export type BackendStatus = 'checking' | 'healthy' | 'unhealthy'

export interface UseBackendHealthResult {
  backendStatus: BackendStatus
  backendInfo: BackendInfo | null
}

export function useBackendHealth(apiUrl: string): UseBackendHealthResult {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking')
  const [backendInfo, setBackendInfo] = useState<BackendInfo | null>(null)

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch(`${apiUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        })

        if (response.ok) {
          const data = await response.json()
          setBackendStatus('healthy')
          setBackendInfo(data)
        } else {
          setBackendStatus('unhealthy')
        }
      } catch (error) {
        logger.error('Backend health check failed', error instanceof Error ? error : undefined)
        setBackendStatus('unhealthy')
      }
    }

    checkBackendHealth()
  }, [apiUrl])

  return { backendStatus, backendInfo }
}
