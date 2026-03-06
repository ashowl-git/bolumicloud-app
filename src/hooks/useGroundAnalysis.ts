'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useApiClient } from '@/lib/api'
import type { GroundAnalysisResult, IsochroneLine } from '@/lib/types/sunlight'

interface UseGroundAnalysisOptions {
  sessionId: string | null
  gridInterval: number
  config: {
    latitude: number
    longitude: number
    timezone: number
    date: { month: number; day: number }
  }
}

interface UseGroundAnalysisReturn {
  groundResult: GroundAnalysisResult | null
  groundIsochrones: IsochroneLine[]
  showGroundHeatmap: boolean
  isGroundAnalyzing: boolean
  setShowGroundHeatmap: (v: boolean) => void
  runGroundAnalysis: () => Promise<void>
}

export function useGroundAnalysis({ sessionId, gridInterval, config }: UseGroundAnalysisOptions): UseGroundAnalysisReturn {
  const api = useApiClient()
  const [groundResult, setGroundResult] = useState<GroundAnalysisResult | null>(null)
  const [groundIsochrones, setGroundIsochrones] = useState<IsochroneLine[]>([])
  const [showGroundHeatmap, setShowGroundHeatmap] = useState(false)
  const [isGroundAnalyzing, setIsGroundAnalyzing] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const runGroundAnalysis = useCallback(async () => {
    if (!sessionId) return
    setIsGroundAnalyzing(true)
    setShowGroundHeatmap(true)
    try {
      const data = await api.post('/sunlight/ground-analysis', {
        session_id: sessionId,
        grid_size: gridInterval,
        altitude: 0.0,
        latitude: config.latitude,
        longitude: config.longitude,
        timezone_offset: config.timezone / 15,
        month: config.date.month,
        day: config.date.day,
        resolution: 'preview',
      })
      const groundId = data.ground_id

      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        try {
          const status = await api.get(`/sunlight/ground/${groundId}/status`)
          if (status.status === 'completed') {
            clearInterval(pollRef.current!)
            pollRef.current = null
            const result = await api.get(`/sunlight/ground/${groundId}/result`)
            setGroundResult(result)
            const isoData = await api.get(`/sunlight/ground/${groundId}/isochrones`)
            setGroundIsochrones(isoData.isochrones || [])
            setIsGroundAnalyzing(false)
          } else if (status.status === 'error') {
            clearInterval(pollRef.current!)
            pollRef.current = null
            setIsGroundAnalyzing(false)
          }
        } catch {
          clearInterval(pollRef.current!)
          pollRef.current = null
          setIsGroundAnalyzing(false)
        }
      }, 2000)
    } catch {
      setIsGroundAnalyzing(false)
    }
  }, [api, sessionId, config])

  return { groundResult, groundIsochrones, showGroundHeatmap, isGroundAnalyzing, setShowGroundHeatmap, runGroundAnalysis }
}
