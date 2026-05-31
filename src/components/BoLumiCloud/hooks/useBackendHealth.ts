'use client'

import { useState, useEffect, useRef } from 'react'
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

// /health 는 ray 캐스팅 probe 등 무거운 검사를 포함해 부하·프록시(Cloudflare) 지연 시
// 느려질 수 있다. liveness 판정에는 넉넉한 타임아웃을 준다.
const HEALTH_TIMEOUT_MS = 15000
const HEALTH_INTERVAL_MS = 30000

export function useBackendHealth(apiUrl: string): UseBackendHealthResult {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking')
  const [backendInfo, setBackendInfo] = useState<BackendInfo | null>(null)
  // 직전 상태를 기억해, 상태가 바뀔 때만 로그를 남긴다(30초마다 에러 스팸 방지)
  const lastStatusRef = useRef<BackendStatus | null>(null)

  useEffect(() => {
    let cancelled = false

    const logTransition = (next: BackendStatus, error?: unknown) => {
      if (lastStatusRef.current === next) return
      lastStatusRef.current = next
      if (next === 'unhealthy') {
        // 반복 실패는 보통 백엔드 다운이 아니라 네트워크/프록시(CORS·Cloudflare 봇보호)
        // 차단인 경우가 많다. 상태 전이 시 한 번만 경고로 남긴다(30초 스팸 방지).
        const reason = error instanceof Error ? error.name : 'unknown'
        logger.warn(
          `Backend 연결 불가(health check 실패: ${reason}) — 네트워크/프록시(Cloudflare 봇보호·CORS) 확인 필요`,
        )
      }
    }

    const checkBackendHealth = async () => {
      try {
        const response = await fetch(`${apiUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
        })

        if (cancelled) return
        if (response.ok) {
          const data = await response.json()
          setBackendStatus('healthy')
          setBackendInfo(data)
          logTransition('healthy')
        } else {
          setBackendStatus('unhealthy')
          logTransition('unhealthy')
        }
      } catch (error) {
        if (cancelled) return
        setBackendStatus('unhealthy')
        logTransition('unhealthy', error)
      }
    }

    checkBackendHealth()

    // 30초마다 재확인 (unhealthy -> healthy 복구 가능)
    const interval = setInterval(checkBackendHealth, HEALTH_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [apiUrl])

  return { backendStatus, backendInfo }
}
