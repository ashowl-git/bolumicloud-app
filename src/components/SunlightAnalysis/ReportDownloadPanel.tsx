'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { FileSpreadsheet, Download, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useApi } from '@/contexts/ApiContext'
import type {
  SunlightAnalysisResult,
  CauseAnalysisResult,
  SunlightConfigState,
  ReportFormat,
  SanalystProjectInfo,
} from '@/lib/types/sunlight'
import { REPORT_FORMAT_LABELS } from '@/lib/types/sunlight'
import SanalystProjectInfoForm, { EMPTY_INFO } from './SanalystProjectInfoForm'

// ─── ReportDownloadPanel ────────────────────

interface ReportDownloadPanelProps {
  sessionId: string
  results: SunlightAnalysisResult
  config: SunlightConfigState
  onCauseAnalysis: (result: CauseAnalysisResult) => void
}

export default function ReportDownloadPanel({
  sessionId,
  results,
  config,
  onCauseAnalysis,
}: ReportDownloadPanelProps) {
  const { apiUrl } = useApi()
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const [reportFormat, setReportFormat] = useState<ReportFormat>('bolumicloud')
  const [projectInfo, setProjectInfo] = useState<SanalystProjectInfo>({ ...EMPTY_INFO })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setError(null)
    setProgress(0)
    setDownloadUrl(null)

    try {
      const body: Record<string, unknown> = {
        session_id: sessionId,
        latitude: config.latitude,
        longitude: config.longitude,
        timezone_offset: config.timezone / 15,
        month: config.date.month,
        day: config.date.day,
        building_type: config.buildingType,
        analysis_result: results,
        report_format: reportFormat,
      }

      if (reportFormat === 'sanalyst') {
        body.project_info = projectInfo
      }

      const res = await fetch(`${apiUrl}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: '보고서 생성 실패' }))
        throw new Error(err.detail || '보고서 생성 실패')
      }

      const data = await res.json()
      const rid = data.report_id

      // Poll status
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`${apiUrl}/reports/${rid}/status`)
          const status = await statusRes.json()

          setProgress(status.progress)

          if (status.status === 'completed') {
            if (pollRef.current) clearInterval(pollRef.current)
            setIsGenerating(false)
            setDownloadUrl(`${apiUrl}${status.download_url}`)

            if (status.cause_analysis) {
              onCauseAnalysis(status.cause_analysis)
            }
          } else if (status.status === 'error') {
            if (pollRef.current) clearInterval(pollRef.current)
            setIsGenerating(false)
            setError(status.error || '보고서 생성 실패')
          }
        } catch {
          // Ignore transient fetch errors
        }
      }, 2000)
    } catch (err) {
      setIsGenerating(false)
      setError(err instanceof Error ? err.message : '보고서 생성 중 오류')
    }
  }, [apiUrl, sessionId, results, config, onCauseAnalysis, reportFormat, projectInfo])

  const handleDownload = useCallback(() => {
    if (!downloadUrl) return
    window.open(downloadUrl, '_blank')
  }, [downloadUrl])

  return (
    <div className="border border-gray-200 p-4 space-y-3">
      {/* 모드 선택 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-900">분석 보고서</span>
        </div>
        <div className="flex items-center gap-1">
          {(['bolumicloud', 'sanalyst'] as ReportFormat[]).map((fmt) => (
            <button
              key={fmt}
              onClick={() => { setReportFormat(fmt); setDownloadUrl(null) }}
              className={`px-3 py-1 text-xs transition-colors ${
                reportFormat === fmt
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {REPORT_FORMAT_LABELS[fmt].ko}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        {REPORT_FORMAT_LABELS[reportFormat].description}
      </p>

      {/* Sanalyst 프로젝트 정보 폼 */}
      {reportFormat === 'sanalyst' && (
        <SanalystProjectInfoForm value={projectInfo} onChange={setProjectInfo} />
      )}

      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          {/* 생성 버튼 */}
          {!isGenerating && !downloadUrl && (
            <button
              onClick={handleGenerate}
              className="flex items-center gap-1.5 border border-gray-200 hover:border-red-600/30
                px-4 py-2 text-sm text-gray-900 hover:text-red-600 transition-all duration-300"
            >
              <FileSpreadsheet size={14} />
              보고서 생성
            </button>
          )}

          {/* 생성 중 */}
          {isGenerating && (
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-gray-500" />
              <span className="text-xs text-gray-500">
                생성 중... {progress.toFixed(0)}%
              </span>
              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 다운로드 버튼 */}
          {downloadUrl && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 border border-green-200 hover:border-green-400
                px-4 py-2 text-sm text-green-700 hover:text-green-800 transition-all duration-300"
            >
              <Download size={14} />
              Excel 다운로드
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
