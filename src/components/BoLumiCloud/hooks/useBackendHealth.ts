'use client'

import { useState, useEffect } from 'react'
// RATIONALE: AbortSignal required for timeout — raw fetch retained
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
    let cancelled = false

    const checkBackendHealth = async () => {
      try {
        const response = await fetch(`${apiUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        })

        if (cancelled) return
        if (response.ok) {
          const data = await response.json()
          setBackendStatus('healthy')
          setBackendInfo(data)
        } else {
          setBackendStatus('unhealthy')
        }
      } catch (error) {
        if (cancelled) return
        logger.error('Backend health check failed', error instanceof Error ? error : undefined)
        setBackendStatus('unhealthy')
      }
    }

    checkBackendHealth()

    // 30초마다 재확인 (unhealthy -> healthy 복구 가능)
    const interval = setInterval(checkBackendHealth, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [apiUrl])

  return { backendStatus, backendInfo }
}
