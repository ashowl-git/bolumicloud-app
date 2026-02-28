'use client'

interface PipelineDownloadsProps {
  apiUrl: string
  sessionId: string
}

interface DownloadItem {
  label: string
  description: string
  url: string
}

export default function PipelineDownloads({ apiUrl, sessionId }: PipelineDownloadsProps) {
  const downloads: DownloadItem[] = [
    {
      label: 'CSV',
      description: '전체 결과 (CSV)',
      url: `${apiUrl}/pipeline/export/csv/${sessionId}`,
    },
    {
      label: 'Excel',
      description: '4개 시트 (XLSX)',
      url: `${apiUrl}/pipeline/export/excel/${sessionId}`,
    },
    {
      label: 'PIC ZIP',
      description: 'HDR 이미지 전체',
      url: `${apiUrl}/pipeline/download/pic-zip/${sessionId}`,
    },
    {
      label: 'Falsecolor ZIP',
      description: 'Falsecolor PNG 전체',
      url: `${apiUrl}/pipeline/download/falsecolor-zip/${sessionId}`,
    },
  ]

  return (
    <div className="border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-900 mb-4">데이터 다운로드</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {downloads.map((item) => (
          <a
            key={item.label}
            href={item.url}
            download
            className="border border-gray-200 hover:border-red-600/30 p-4
              text-center transition-all duration-300 group"
          >
            <p className="text-sm font-medium text-gray-900 group-hover:text-red-600">
              {item.label}
            </p>
            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
