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
  // 스테일 응답 가드: 재실행 시 토큰 증가, 캡처 토큰과 다르면 결과 폐기
  const requestIdRef = useRef(0)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const runGroundAnalysis = useCallback(async () => {
    if (!sessionId) return
    const reqId = ++requestIdRef.current
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
      // 응답 도착 사이 재실행되었으면 폐기
      if (reqId !== requestIdRef.current) return
      const groundId = data.ground_id

      if (pollRef.current) clearInterval(pollRef.current)
      let pollCount = 0
      const MAX_POLLS = 150 // 5분 (2초 간격)
      pollRef.current = setInterval(async () => {
        try {
          pollCount++
          if (pollCount > MAX_POLLS) {
            clearInterval(pollRef.current!)
            pollRef.current = null
            if (reqId === requestIdRef.current) setIsGroundAnalyzing(false)
            return
          }
          const status = await api.get(`/sunlight/ground/${groundId}/status`)
          // 폴링 도중 재실행되었으면 이 루프 종료 (새 실행이 상태 소유)
          if (reqId !== requestIdRef.current) {
            clearInterval(pollRef.current!)
            pollRef.current = null
            return
          }
          if (status.status === 'completed') {
            clearInterval(pollRef.current!)
            pollRef.current = null
            const result = await api.get(`/sunlight/ground/${groundId}/result`)
            const isoData = await api.get(`/sunlight/ground/${groundId}/isochrones`)
            if (reqId !== requestIdRef.current) return
            setGroundResult(result)
            setGroundIsochrones(isoData.isochrones || [])
            setIsGroundAnalyzing(false)
          } else if (status.status === 'error') {
            clearInterval(pollRef.current!)
            pollRef.current = null
            if (reqId === requestIdRef.current) setIsGroundAnalyzing(false)
          }
        } catch {
          clearInterval(pollRef.current!)
          pollRef.current = null
          if (reqId === requestIdRef.current) setIsGroundAnalyzing(false)
        }
      }, 2000)
    } catch {
      if (reqId === requestIdRef.current) setIsGroundAnalyzing(false)
    }
  }, [api, sessionId, config, gridInterval])

  return { groundResult, groundIsochrones, showGroundHeatmap, isGroundAnalyzing, setShowGroundHeatmap, runGroundAnalysis }
}
