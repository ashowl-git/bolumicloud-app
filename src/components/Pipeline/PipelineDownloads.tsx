'use client'

import { FileSpreadsheet, Table, ImageDown, Palette } from 'lucide-react'

interface PipelineDownloadsProps {
  apiUrl: string
  sessionId: string
}

interface DownloadItem {
  label: string
  description: string
  url: string
  icon: typeof FileSpreadsheet
}

export default function PipelineDownloads({ apiUrl, sessionId }: PipelineDownloadsProps) {
  const downloads: DownloadItem[] = [
    {
      label: 'CSV',
      description: '전체 결과 (CSV)',
      url: `${apiUrl}/pipeline/export/csv/${sessionId}`,
      icon: FileSpreadsheet,
    },
    {
      label: 'Excel',
      description: '4개 시트 (XLSX)',
      url: `${apiUrl}/pipeline/export/excel/${sessionId}`,
      icon: Table,
    },
    {
      label: 'PIC ZIP',
      description: 'HDR 이미지 전체',
      url: `${apiUrl}/pipeline/download/pic-zip/${sessionId}`,
      icon: ImageDown,
    },
    {
      label: 'Falsecolor ZIP',
      description: 'Falsecolor PNG 전체',
      url: `${apiUrl}/pipeline/download/falsecolor-zip/${sessionId}`,
      icon: Palette,
    },
  ]

  return (
    <div className="border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-900 mb-4">데이터 다운로드</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {downloads.map((item) => {
          const Icon = item.icon
          return (
            <a
              key={item.label}
              href={item.url}
              download
              className="border border-gray-200 hover:border-red-600/30 p-4
                text-center transition-all duration-300 group hover:-translate-y-0.5"
            >
              <Icon size={20} strokeWidth={1.5} className="mx-auto text-gray-400 group-hover:text-red-600 transition-colors duration-300 mb-2" />
              <p className="text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors duration-300">
                {item.label}
              </p>
              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
            </a>
          )
        })}
      </div>
    </div>
  )
}
