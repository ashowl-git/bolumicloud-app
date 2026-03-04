'use client'

import { FileSpreadsheet, Download, Loader2 } from 'lucide-react'
import { useReportGeneration } from '@/hooks/useReportGeneration'
import type { ViewAnalysisResult } from '@/lib/types/view'

interface ViewReportButtonProps {
  sessionId: string
  results: ViewAnalysisResult
}

export default function ViewReportButton({ sessionId, results }: ViewReportButtonProps) {
  const { reportDownloadUrl, isGeneratingReport, error, generateReport } = useReportGeneration({
    sessionId,
    analysisType: 'view',
    results,
  })

  if (reportDownloadUrl) {
    return (
      <button
        onClick={() => window.open(reportDownloadUrl, '_blank')}
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
        onClick={generateReport}
        disabled={isGeneratingReport}
        className="flex items-center gap-1.5 border border-gray-200 hover:border-red-600/30
          px-3 py-1.5 text-xs text-gray-900 hover:text-red-600 transition-all disabled:opacity-50"
      >
        {isGeneratingReport ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />}
        {isGeneratingReport ? '생성 중...' : '조망 보고서'}
      </button>
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  )
}
