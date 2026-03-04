'use client'

import { useState, useEffect } from 'react'
import { useApi } from '@/contexts/ApiContext'
// RATIONALE: AbortSignal required for cleanup — raw fetch retained

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SunPathPosition {
  hour: number
  altitude: number
  azimuth: number
  zenith?: number
}

interface SunPathEntry {
  label: string
  date: string
  data: SunPathPosition[]
}

interface UseSunPathDataOptions {
  latitude: number
  longitude: number
  year?: number
  apiBaseUrl?: string
  enabled?: boolean
}

interface UseSunPathDataResult {
  data: SunPathEntry[] | null
  loading: boolean
  error: string | null
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Backend API에서 연간 태양 궤적 데이터를 가져온다.
 *
 * GET /sunpath/annual 엔드포인트를 호출하여 결과를 반환한다.
 * enabled가 false이면 fetch를 수행하지 않는다.
 */
export function useSunPathData({
  latitude,
  longitude,
  year,
  apiBaseUrl,
  enabled = true,
}: UseSunPathDataOptions): UseSunPathDataResult {
  const { apiUrl: contextApiUrl } = useApi()
  const [data, setData] = useState<SunPathEntry[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    const baseUrl = apiBaseUrl || contextApiUrl
    const resolvedYear = year || new Date().getFullYear()
    const url = `${baseUrl}/sunpath/annual?lat=${latitude}&lng=${longitude}&year=${resolvedYear}`

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (!controller.signal.aborted) {
          setData(json.paths || [])
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          if (err.name !== 'AbortError') {
            setError(err.message)
          }
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [latitude, longitude, year, apiBaseUrl, contextApiUrl, enabled])

  return { data, loading, error }
}
