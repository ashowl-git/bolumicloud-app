'use client'

import { FileSpreadsheet, Loader2 } from 'lucide-react'

import WorkspacePanelSection from '../Workspace/WorkspacePanelSection'

interface ReportSectionProps {
  onGenerateReport?: () => void
  reportDownloadUrl?: string | null
  isGeneratingReport?: boolean
}

export default function ReportSection({
  onGenerateReport,
  reportDownloadUrl,
  isGeneratingReport,
}: ReportSectionProps) {
  return (
    <WorkspacePanelSection title="보고서" icon={<FileSpreadsheet size={14} />} defaultOpen={false}>
      <div className="flex items-center gap-2">
        {!reportDownloadUrl && onGenerateReport && (
          <button
            onClick={onGenerateReport}
            disabled={isGeneratingReport}
            className="flex items-center gap-1.5 border border-gray-200 hover:border-red-600/30
              px-3 py-1.5 text-xs text-gray-900 hover:text-red-600 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingReport && <Loader2 size={12} className="animate-spin" />}
            {isGeneratingReport ? '보고서 생성 중...' : 'Excel 보고서 생성'}
          </button>
        )}
        {reportDownloadUrl && (
          <a
            href={reportDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 border border-green-200 hover:border-green-400
              px-3 py-1.5 text-xs text-green-700 hover:text-green-800 transition-all"
          >
            Excel 다운로드
          </a>
        )}
      </div>
    </WorkspacePanelSection>
  )
}
