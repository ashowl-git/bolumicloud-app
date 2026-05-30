'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { FileSpreadsheet, Download, Loader2 } from 'lucide-react'
import { useApiClient } from '@/lib/api'
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
  modelId?: string | null
  /** .sn5f 로 임포트된 모델만 Sanalyst 파일로 export 가능 */
  canExportSn5f?: boolean
  results: SunlightAnalysisResult
  config: SunlightConfigState
  onCauseAnalysis: (result: CauseAnalysisResult) => void
}

export default function ReportDownloadPanel({
  sessionId,
  modelId,
  canExportSn5f,
  results,
  config,
  onCauseAnalysis,
}: ReportDownloadPanelProps) {
  const api = useApiClient()
  const { apiUrl } = useApi()
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const [reportFormat, setReportFormat] = useState<ReportFormat>('bolumicloud')
  const [projectInfo, setProjectInfo] = useState<SanalystProjectInfo>({ ...EMPTY_INFO })
  const [isExporting, setIsExporting] = useState(false)

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

      if (reportFormat === 'sanalyst' || reportFormat === 'timetable') {
        body.project_info = projectInfo
      }

      const data = await api.post('/reports/generate', body)
      const rid = data.report_id

      // Poll status
      pollRef.current = setInterval(async () => {
        try {
          const status = await api.get(`/reports/${rid}/status`)

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
  }, [api, apiUrl, sessionId, results, config, onCauseAnalysis, reportFormat, projectInfo])

  const handleDownload = useCallback(() => {
    if (!downloadUrl) return
    window.open(downloadUrl, '_blank')
  }, [downloadUrl])

  // .sn5f export: 원본 지오메트리 + 현재 분석조건을 Sanalyst 파일로 (조건 주입)
  const handleExportSn5f = useCallback(async () => {
    if (!modelId) return
    setIsExporting(true)
    setError(null)
    try {
      const exportConfig = {
        azimuth: config.azimuth,
        month: config.date.month,
        day: config.date.day,
        latitude: config.latitude,
        longitude: config.longitude,
        standard_meridian: config.timezone,
        solar_time_mode: config.solarTimeMode,
        total_sun_start: config.totalThreshold.startHour,
        total_sun_end: config.totalThreshold.endHour,
        total_sun_threshold: Math.round(config.totalThreshold.requiredHours * 60),
        continuous_sun_start: config.continuousThreshold.startHour,
        continuous_sun_end: config.continuousThreshold.endHour,
        continuous_sun_threshold: Math.round(config.continuousThreshold.requiredHours * 60),
      }
      // config + result 동봉: Sanalyst 가 BoLumiCloud 조건·결과를 그대로 표시
      const blob = await api.postBlob(`/import/${modelId}/export-sn5f`, {
        config: exportConfig,
        result: results,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'bolumicloud_export.sn5f'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sanalyst 파일 내보내기 실패')
    } finally {
      setIsExporting(false)
    }
  }, [api, modelId, config, results])

  return (
    <div className="border border-gray-200 dark:border-slate-700 p-4 space-y-3">
      {/* 모드 선택 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-gray-500 dark:text-slate-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-slate-100">분석 보고서</span>
        </div>
        <div className="flex items-center gap-1">
          {(['bolumicloud', 'sanalyst', 'timetable'] as ReportFormat[]).map((fmt) => (
            <button
              key={fmt}
              onClick={() => { setReportFormat(fmt); setDownloadUrl(null) }}
              className={`px-3 py-1 text-xs transition-colors ${
                reportFormat === fmt
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200'
              }`}
            >
              {REPORT_FORMAT_LABELS[fmt].ko}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-slate-500">
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
              className="flex items-center gap-1.5 border border-gray-200 dark:border-slate-700 hover:border-red-600/30
                px-4 py-2 text-sm text-gray-900 dark:text-slate-100 hover:text-red-600 transition-all duration-300"
            >
              <FileSpreadsheet size={14} />
              보고서 생성
            </button>
          )}

          {/* 생성 중 */}
          {isGenerating && (
            <div className="flex items-center gap-2" aria-live="polite">
              <Loader2 size={14} className="animate-spin text-gray-500 dark:text-slate-400" />
              <span className="text-xs text-gray-500 dark:text-slate-400">
                생성 중... {progress.toFixed(0)}%
              </span>
              <div
                className="w-20 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="보고서 생성 진행률"
              >
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 다운로드 버튼 */}
          {downloadUrl && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 border border-green-200 hover:border-green-400
                  px-4 py-2 text-sm text-green-700 hover:text-green-800 transition-all duration-300"
              >
                <Download size={14} />
                Excel 다운로드
              </button>
              <span className="text-xs text-gray-400 dark:text-slate-500">2시간 내 다운로드하세요</span>
            </div>
          )}
        </div>
      </div>

      {/* Sanalyst 파일 내보내기 (.sn5f 임포트 모델만) */}
      {canExportSn5f && modelId && (
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-3">
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-slate-300">Sanalyst 파일로 내보내기</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">원본 모델 + 분석조건 + BoLumiCloud 결과를 .sn5f 로 (Sanalyst 에서 바로 확인)</p>
          </div>
          <button
            onClick={handleExportSn5f}
            disabled={isExporting}
            className="flex items-center gap-1.5 border border-gray-200 dark:border-slate-700 hover:border-red-600/30
              px-4 py-2 text-sm text-gray-900 dark:text-slate-100 hover:text-red-600 transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting
              ? <Loader2 size={14} className="animate-spin" />
              : <Download size={14} />}
            {isExporting ? '생성 중...' : '.sn5f 내보내기'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
