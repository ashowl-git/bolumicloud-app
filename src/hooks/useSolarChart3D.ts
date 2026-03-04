'use client'

import { useState, useCallback } from 'react'
import { useApiClient } from '@/lib/api'

export interface SolarChartRay {
  time: string
  altitude: number
  azimuth: number
  endpoint: [number, number, number]
  blocked: boolean
  blocker_id: string | null
}

export interface SolarChart3DData {
  point: [number, number, number]
  rays: SolarChartRay[]
  ray_length: number
  total_range: { start: string; end: string }
  continuous_range: { start: string; end: string }
  sunlit_intervals: { start: string; end: string; label: string }[]
  summary: { total_hours: number; continuous_hours: number }
}

interface UseSolarChart3DParams {
  session_id: string
  point: [number, number, number]
  point_normal?: [number, number, number] | null
  latitude: number
  longitude: number
  timezone_offset: number
  month: number
  day: number
  step_minutes?: number
  ray_length?: number | null
}

interface UseSolarChart3DReturn {
  data: SolarChart3DData | null
  isLoading: boolean
  error: string | null
  compute: (params: UseSolarChart3DParams) => Promise<void>
  clear: () => void
}

export function useSolarChart3D(): UseSolarChart3DReturn {
  const api = useApiClient()
  const [data, setData] = useState<SolarChart3DData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const compute = useCallback(async (params: UseSolarChart3DParams) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await api.post('/sunlight/solar-chart-3d', {
        session_id: params.session_id,
        point: params.point,
        point_normal: params.point_normal ?? null,
        latitude: params.latitude,
        longitude: params.longitude,
        timezone_offset: params.timezone_offset,
        month: params.month,
        day: params.day,
        step_minutes: params.step_minutes ?? 5,
        ray_length: params.ray_length ?? null,
      })
      setData(result as SolarChart3DData)
    } catch (e) {
      setError(e instanceof Error ? e.message : '일조도표 계산 실패')
    } finally {
      setIsLoading(false)
    }
  }, [api])

  const clear = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  return { data, isLoading, error, compute, clear }
}
