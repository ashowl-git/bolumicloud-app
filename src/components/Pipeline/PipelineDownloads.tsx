'use client'

import { useState } from 'react'
import { FileSpreadsheet, Table, ImageDown, Palette } from 'lucide-react'
import { useApiClient } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'

interface PipelineDownloadsProps {
  apiUrl: string
  sessionId: string
}

interface DownloadItem {
  label: string
  description: string
  path: string
  filename: string
  icon: typeof FileSpreadsheet
}

export default function PipelineDownloads({ sessionId }: PipelineDownloadsProps) {
  const api = useApiClient()
  const { showToast } = useToast()
  const [downloadingLabel, setDownloadingLabel] = useState<string | null>(null)

  const downloads: DownloadItem[] = [
    {
      label: 'CSV',
      description: '전체 결과 (CSV)',
      path: `/pipeline/export/csv/${sessionId}`,
      filename: `results_${sessionId}.csv`,
      icon: FileSpreadsheet,
    },
    {
      label: 'Excel',
      description: '4개 시트 (XLSX)',
      path: `/pipeline/export/excel/${sessionId}`,
      filename: `results_${sessionId}.xlsx`,
      icon: Table,
    },
    {
      label: 'PIC ZIP',
      description: 'HDR 이미지 전체',
      path: `/pipeline/download/pic-zip/${sessionId}`,
      filename: `pic_${sessionId}.zip`,
      icon: ImageDown,
    },
    {
      label: 'Falsecolor ZIP',
      description: 'Falsecolor PNG 전체',
      path: `/pipeline/download/falsecolor-zip/${sessionId}`,
      filename: `falsecolor_${sessionId}.zip`,
      icon: Palette,
    },
  ]

  const handleDownload = async (item: DownloadItem) => {
    setDownloadingLabel(item.label)
    try {
      await api.downloadBlob(item.path, item.filename)
    } catch {
      showToast({ type: 'error', message: '파일 다운로드에 실패했습니다' })
    } finally {
      setDownloadingLabel(null)
    }
  }

  return (
    <div className="border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-900 mb-4">데이터 다운로드</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {downloads.map((item) => {
          const Icon = item.icon
          const isDownloading = downloadingLabel === item.label
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => handleDownload(item)}
              disabled={isDownloading}
              className="border border-gray-200 hover:border-red-600/30 p-4
                text-center transition-all duration-300 group hover:-translate-y-0.5
                disabled:opacity-50 disabled:cursor-wait"
            >
              {isDownloading ? (
                <div className="mx-auto w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin mb-2" />
              ) : (
                <Icon size={20} strokeWidth={1.5} className="mx-auto text-gray-400 group-hover:text-red-600 transition-colors duration-300 mb-2" />
              )}
              <p className="text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors duration-300">
                {item.label}
              </p>
              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
