'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Image as ImageIcon, Thermometer, Download } from 'lucide-react'
import type { GlareResult } from '@/lib/types/glare'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface PipelineImageViewerProps {
  result: GlareResult
  apiUrl: string
  sessionId: string
  onClose: () => void
}

export default function PipelineImageViewer({
  result,
  apiUrl,
  sessionId,
  onClose,
}: PipelineImageViewerProps) {
  const [mode, setMode] = useState<'preview' | 'falsecolor'>('preview')
  const [fcScale, setFcScale] = useState(1000)
  const [fcDisplayScale, setFcDisplayScale] = useState(1000)
  const modalRef = useRef<HTMLDivElement>(null)
  const isOpen = true

  useFocusTrap(modalRef, isOpen)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  const previewUrl = `${apiUrl}/pipeline/preview/${sessionId}/${result.file}`
  const falsecolorUrl = `${apiUrl}/pipeline/falsecolor/${sessionId}/${result.file}?scale=${fcScale}`
  const downloadUrl = `${apiUrl}/pipeline/download/pic/${sessionId}/${result.file}`

  const ratingColor = (rating: string) => {
    switch (rating) {
      case '감지못함': return 'bg-green-100 text-green-800'
      case '감지': return 'bg-yellow-100 text-yellow-800'
      case '방해': return 'bg-orange-100 text-orange-800'
      case '견딜수없음': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="이미지 뷰어"
      onKeyDown={handleKeyDown}
      ref={modalRef}
    >
      <div
        className="bg-white max-w-6xl w-full mx-4 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 font-mono">{result.file}</h3>
            <div className="flex items-center gap-2 mt-1">
              {result.viewp && <span className="text-xs text-gray-500">{result.viewp}</span>}
              {result.date_label && <span className="text-xs text-gray-500">| {result.date_label}</span>}
              {result.time && <span className="text-xs text-gray-500">| {result.time}시</span>}
              <span className={`px-1.5 py-0.5 text-xs font-semibold ${ratingColor(result.dgp_rating)}`}>
                DGP {Number(result.dgp).toFixed(3)} ({result.dgp_rating})
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 transition-colors duration-300"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Mode toggle + Scale */}
        <div className="flex items-center gap-4 border-b border-gray-100 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border transition-all duration-300 ${
                mode === 'preview'
                  ? 'border-red-600 text-red-600 bg-red-50'
                  : 'border-gray-200 text-gray-700 hover:border-red-600/30'
              }`}
            >
              <ImageIcon size={14} strokeWidth={1.5} />
              HDR
            </button>
            <button
              onClick={() => setMode('falsecolor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border transition-all duration-300 ${
                mode === 'falsecolor'
                  ? 'border-red-600 text-red-600 bg-red-50'
                  : 'border-gray-200 text-gray-700 hover:border-red-600/30'
              }`}
            >
              <Thermometer size={14} strokeWidth={1.5} />
              Falsecolor
            </button>
          </div>

          {mode === 'falsecolor' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">스케일:</label>
              <input
                type="range"
                min={100}
                max={12000}
                step={100}
                value={fcDisplayScale}
                onChange={(e) => setFcDisplayScale(Number(e.target.value))}
                onMouseUp={() => setFcScale(fcDisplayScale)}
                onTouchEnd={() => setFcScale(fcDisplayScale)}
                className="w-32 accent-red-600"
              />
              <span className="text-xs text-gray-700 w-20">{fcDisplayScale} cd/m2</span>
            </div>
          )}

          <a
            href={downloadUrl}
            download
            className="ml-auto flex items-center gap-1.5 border border-gray-200 hover:border-red-600/30 px-3 py-1.5
              text-sm text-gray-700 hover:text-red-600 transition-all duration-300"
          >
            <Download size={14} strokeWidth={1.5} />
            PIC
          </a>
        </div>

        {/* Image */}
        <div className="p-4 flex justify-center bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={mode === 'falsecolor' ? `fc-${fcScale}` : 'preview'}
            src={mode === 'preview' ? previewUrl : falsecolorUrl}
            alt={result.file}
            className="max-w-full max-h-[60vh] object-contain"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border-t border-gray-100 text-center text-sm">
          <div>
            <p className="text-gray-500 text-xs">평균 휘도</p>
            <p className="font-medium">{Number(result.average).toFixed(1)} cd/m2</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">최대 휘도</p>
            <p className="font-medium">{Number(result.max).toFixed(1)} cd/m2</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">DGP</p>
            <p className="font-medium">{Number(result.dgp).toFixed(4)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">DGI</p>
            <p className="font-medium">{Number(result.dgi).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
