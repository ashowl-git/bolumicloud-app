'use client'

import { Eye, EyeOff, Target, MapPin, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { LayerConfig } from '@/lib/types/sunlight'

interface LayerPanelProps {
  layers: LayerConfig[]
  onToggleVisibility: (layerId: string) => void
  onToggleAnalysisTarget: (layerId: string) => void
  onToggleAll?: (visible: boolean) => void
  onGenerateGroupPoints?: (layerId: string) => Promise<number>
}

export default function LayerPanel({
  layers,
  onToggleVisibility,
  onToggleAnalysisTarget,
  onToggleAll,
  onGenerateGroupPoints,
}: LayerPanelProps) {
  const allVisible = layers.every(l => l.visible)
  const targetCount = layers.filter(l => l.isAnalysisTarget).length
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  if (layers.length === 0) {
    return (
      <div className="text-xs text-gray-500 text-center py-3">
        레이어 정보 없음
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {/* Header with toggle all */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 px-1 mb-1">
        <span>{layers.length}개 레이어 (분석 대상: {targetCount})</span>
        {onToggleAll && (
          <button
            onClick={() => onToggleAll(!allVisible)}
            className="hover:text-gray-600 transition-colors"
          >
            {allVisible ? '전체 숨기기' : '전체 표시'}
          </button>
        )}
      </div>

      {/* Layer list */}
      {layers.map((layer) => (
        <div
          key={layer.id}
          className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-xs transition-colors ${
            layer.visible ? 'bg-white' : 'bg-gray-50 opacity-60'
          }`}
        >
          {/* Color indicator */}
          <div
            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: layer.color || '#94a3b8' }}
          />

          {/* Name */}
          <span className="flex-1 truncate text-gray-700">{layer.name}</span>

          {/* Face count */}
          {layer.faceCount != null && (
            <span className="text-[9px] text-gray-300 tabular-nums">{layer.faceCount.toLocaleString()}</span>
          )}

          {/* Generate measurement points */}
          {onGenerateGroupPoints && (
            <button
              onClick={async () => {
                setGeneratingId(layer.id)
                try {
                  await onGenerateGroupPoints(layer.id)
                } finally {
                  setGeneratingId(null)
                }
              }}
              disabled={generatingId === layer.id}
              className="p-0.5 rounded transition-colors text-gray-300 hover:text-blue-500 disabled:opacity-50"
              title="측정점 자동 생성"
            >
              {generatingId === layer.id
                ? <Loader2 size={12} className="animate-spin" />
                : <MapPin size={12} />
              }
            </button>
          )}

          {/* Analysis target toggle */}
          <button
            onClick={() => onToggleAnalysisTarget(layer.id)}
            className={`p-0.5 rounded transition-colors ${
              layer.isAnalysisTarget
                ? 'text-red-500 hover:text-red-600'
                : 'text-gray-300 hover:text-gray-400'
            }`}
            title={layer.isAnalysisTarget ? '분석 대상 해제' : '분석 대상 지정'}
          >
            <Target size={12} />
          </button>

          {/* Visibility toggle */}
          <button
            onClick={() => onToggleVisibility(layer.id)}
            className={`p-0.5 rounded transition-colors ${
              layer.visible
                ? 'text-gray-500 hover:text-gray-700'
                : 'text-gray-300 hover:text-gray-400'
            }`}
            title={layer.visible ? '숨기기' : '표시'}
          >
            {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        </div>
      ))}
    </div>
  )
}
