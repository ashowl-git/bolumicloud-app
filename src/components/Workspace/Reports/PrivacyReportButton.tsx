'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { FileSpreadsheet, Download, Loader2 } from 'lucide-react'
import { useApi } from '@/contexts/ApiContext'
import type { PrivacyAnalysisResult } from '@/lib/types/privacy'

interface PrivacyReportButtonProps {
  sessionId: string
  results: PrivacyAnalysisResult
}

export default function PrivacyReportButton({ sessionId, results }: PrivacyReportButtonProps) {
  const { apiUrl } = useApi()
  const [isGenerating, setIsGenerating] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch(`${apiUrl}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_type: 'privacy',
          session_id: sessionId,
          analysis_result: results,
        }),
      })
      if (!res.ok) throw new Error('보고서 생성 실패')
      const data = await res.json()

      pollRef.current = setInterval(async () => {
        const statusRes = await fetch(`${apiUrl}/reports/${data.report_id}/status`)
        const status = await statusRes.json()
        if (status.status === 'completed') {
          if (pollRef.current) clearInterval(pollRef.current)
          setIsGenerating(false)
          setDownloadUrl(`${apiUrl}${status.download_url}`)
        } else if (status.status === 'error') {
          if (pollRef.current) clearInterval(pollRef.current)
          setIsGenerating(false)
          setError(status.error || '보고서 생성 실패')
        }
      }, 2000)
    } catch (err) {
      setIsGenerating(false)
      setError(err instanceof Error ? err.message : '보고서 생성 오류')
    }
  }, [apiUrl, sessionId, results])

  if (downloadUrl) {
    return (
      <button
        onClick={() => window.open(downloadUrl, '_blank')}
        className="flex items-center gap-1.5 border border-green-200 hover:border-green-400
          px-3 py-1.5 text-xs text-green-700 hover:text-green-800 transition-all"
      >
        <Download size={12} />
        Excel 다운로드
      </button>
    )
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="flex items-center gap-1.5 border border-gray-200 hover:border-red-600/30
          px-3 py-1.5 text-xs text-gray-900 hover:text-red-600 transition-all disabled:opacity-50"
      >
        {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />}
        {isGenerating ? '생성 중...' : '사생활 보고서'}
      </button>
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  )
}
