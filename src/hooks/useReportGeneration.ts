'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useApiClient } from '@/lib/api'
import { useApi } from '@/contexts/ApiContext'
import type { CauseAnalysisResult } from '@/lib/types/sunlight'

type AnalysisType = 'sunlight' | 'view' | 'privacy' | 'solar_pv'

interface UseReportGenerationOptions {
  sessionId: string | null
  analysisType?: AnalysisType
  config?: {
    latitude: number
    longitude: number
    timezone: number
    date: { month: number; day: number }
    buildingType: string
  }
  results: unknown
  /** Auto-generate report when results become available */
  autoGenerate?: boolean
}

const REPORT_TIMEOUT = 5 * 60 * 1000 // 5분

interface UseReportGenerationReturn {
  reportDownloadUrl: string | null
  isGeneratingReport: boolean
  progress: number
  error: string | null
  causeResult: CauseAnalysisResult | null
  generateReport: () => Promise<void>
}

export function useReportGeneration({ sessionId, analysisType = 'sunlight', config, results, autoGenerate = false }: UseReportGenerationOptions): UseReportGenerationReturn {
  const { apiUrl } = useApi()
  const api = useApiClient()
  const [reportDownloadUrl, setReportDownloadUrl] = useState<string | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [causeResult, setCauseResult] = useState<CauseAnalysisResult | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const cleanupTimers = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
  }, [])

  const generateReport = useCallback(async () => {
    if (!sessionId || !results) return
    setIsGeneratingReport(true)
    setError(null)
    setProgress(0)
    setReportDownloadUrl(null)

    try {
      // Build payload based on analysis type
      const payload: Record<string, unknown> = {
        session_id: sessionId,
        analysis_result: results,
      }

      if (analysisType !== 'sunlight') {
        payload.analysis_type = analysisType
      }

      // Sunlight-specific config fields
      if (analysisType === 'sunlight' && config) {
        payload.latitude = config.latitude
        payload.longitude = config.longitude
        payload.timezone_offset = config.timezone / 15
        payload.month = config.date.month
        payload.day = config.date.day
        payload.building_type = config.buildingType
      }

      const data = await api.post('/reports/generate', payload)
      const rid = data.report_id

      // 5-minute timeout
      timeoutRef.current = setTimeout(() => {
        cleanupTimers()
        setIsGeneratingReport(false)
        setError('보고서 생성 시간이 초과되었습니다.')
      }, REPORT_TIMEOUT)

      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        try {
          const status = await api.get(`/reports/${rid}/status`)
          if (status.progress != null) setProgress(status.progress)
          if (status.status === 'completed') {
            cleanupTimers()
            setIsGeneratingReport(false)
            setReportDownloadUrl(`${apiUrl}${status.download_url}`)
            if (status.cause_analysis) setCauseResult(status.cause_analysis)
          } else if (status.status === 'error') {
            cleanupTimers()
            setIsGeneratingReport(false)
            setError(status.error || '보고서 생성 실패')
          }
        } catch {
          cleanupTimers()
          setIsGeneratingReport(false)
          setError('보고서 상태 조회 실패')
        }
      }, 2000)
    } catch {
      setIsGeneratingReport(false)
      setError('보고서 생성 오류')
    }
  }, [api, apiUrl, sessionId, analysisType, results, config, cleanupTimers])

  // Auto-generate report when results first become available
  const autoTriggeredRef = useRef(false)
  useEffect(() => {
    if (autoGenerate && results && sessionId && !autoTriggeredRef.current && !isGeneratingReport && !reportDownloadUrl) {
      autoTriggeredRef.current = true
      generateReport()
    }
    // Reset when session changes (new analysis)
    if (!results) {
      autoTriggeredRef.current = false
    }
  }, [autoGenerate, results, sessionId, isGeneratingReport, reportDownloadUrl, generateReport])

  return { reportDownloadUrl, isGeneratingReport, progress, error, causeResult, generateReport }
}
