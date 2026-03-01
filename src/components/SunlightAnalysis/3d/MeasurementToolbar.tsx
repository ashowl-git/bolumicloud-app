'use client'

import { MousePointer2, Plus, Trash2 } from 'lucide-react'
import type { PlacementMode } from '../hooks/useMeasurementPlacement'

// ─── MeasurementToolbar ─────────────────────

interface MeasurementToolbarProps {
  mode: PlacementMode
  pointCount: number
  onModeChange: (mode: PlacementMode) => void
  onClearAll: () => void
}

const MODES: { id: PlacementMode; icon: typeof MousePointer2; label: string }[] = [
  { id: 'view', icon: MousePointer2, label: '보기' },
  { id: 'add', icon: Plus, label: '측정점 추가' },
  { id: 'delete', icon: Trash2, label: '측정점 삭제' },
]

export default function MeasurementToolbar({
  mode,
  pointCount,
  onModeChange,
  onClearAll,
}: MeasurementToolbarProps) {
  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1
      bg-white/90 border border-gray-200 p-1"
    >
      {MODES.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onModeChange(id)}
          title={label}
          className={`p-1.5 transition-colors ${
            mode === id
              ? 'text-red-600 bg-red-50'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Icon size={16} />
        </button>
      ))}

      {pointCount > 0 && (
        <>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <span className="text-xs text-gray-500 px-1">{pointCount}점</span>
          <button
            onClick={onClearAll}
            className="text-xs text-gray-400 hover:text-red-500 px-1"
          >
            초기화
          </button>
        </>
      )}
    </div>
  )
}
