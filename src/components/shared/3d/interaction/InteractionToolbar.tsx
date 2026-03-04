'use client'

import { useEffect } from 'react'
import { MousePointer2, Plus, Trash2, Grid3X3, Eye } from 'lucide-react'
import type { InteractionMode } from './types'

// ─── 분석 유형별 모드 구성 ─────────────────────────

export type AnalysisType = 'sunlight' | 'view' | 'privacy'

interface ModeConfig {
  id: InteractionMode
  icon: typeof MousePointer2
  label: string
}

const SUNLIGHT_MODES: ModeConfig[] = [
  { id: 'navigate', icon: MousePointer2, label: '탐색' },
  { id: 'place_point', icon: Plus, label: '측정점 추가' },
  { id: 'place_area', icon: Grid3X3, label: '측정 영역' },
  { id: 'delete', icon: Trash2, label: '삭제' },
]

const VIEW_MODES: ModeConfig[] = [
  { id: 'navigate', icon: MousePointer2, label: '탐색' },
  { id: 'place_point', icon: Eye, label: '관찰점 추가' },
  { id: 'delete', icon: Trash2, label: '삭제' },
]

const PRIVACY_MODES: ModeConfig[] = [
  { id: 'navigate', icon: MousePointer2, label: '탐색' },
  { id: 'place_point', icon: Plus, label: '창문 추가' },
  { id: 'delete', icon: Trash2, label: '삭제' },
]

const MODE_MAP: Record<AnalysisType, ModeConfig[]> = {
  sunlight: SUNLIGHT_MODES,
  view: VIEW_MODES,
  privacy: PRIVACY_MODES,
}

// ─── InteractionToolbar ─────────────────────────────

interface InteractionToolbarProps {
  analysisType: AnalysisType
  mode: InteractionMode
  onModeChange: (mode: InteractionMode) => void
  pointCount: number
  onClearAll: () => void
  // 사생활 전용: 대상/관찰 수 표시
  targetCount?: number
  observerCount?: number
  // 사생활 전용: 역할 선택
  activeRole?: 'target' | 'observer'
  onRoleChange?: (role: 'target' | 'observer') => void
}

export default function InteractionToolbar({
  analysisType,
  mode,
  onModeChange,
  pointCount,
  onClearAll,
  targetCount,
  observerCount,
  activeRole,
  onRoleChange,
}: InteractionToolbarProps) {
  const modes = MODE_MAP[analysisType]

  // Escape 키로 탐색 모드 복귀
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onModeChange('navigate')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onModeChange])

  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1
      bg-white/90 border border-gray-200 p-1"
    >
      {/* 모드 버튼 */}
      {modes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onModeChange(id)}
          title={label}
          aria-label={label}
          aria-pressed={mode === id}
          className={`p-1.5 transition-colors ${
            mode === id
              ? 'text-red-600 bg-red-50'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Icon size={16} />
        </button>
      ))}

      {/* 사생활: 역할 토글 */}
      {analysisType === 'privacy' && onRoleChange && (
        <>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <button
            onClick={() => onRoleChange('target')}
            title="대상 건물"
            aria-label="대상 건물"
            aria-pressed={activeRole === 'target'}
            className={`px-2 py-0.5 text-xs transition-colors ${
              activeRole === 'target'
                ? 'text-orange-600 bg-orange-50 border border-orange-200'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            대상
          </button>
          <button
            onClick={() => onRoleChange('observer')}
            title="관찰 건물"
            aria-label="관찰 건물"
            aria-pressed={activeRole === 'observer'}
            className={`px-2 py-0.5 text-xs transition-colors ${
              activeRole === 'observer'
                ? 'text-blue-600 bg-blue-50 border border-blue-200'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            관찰
          </button>
        </>
      )}

      {/* 포인트 수 */}
      {pointCount > 0 && (
        <>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          {analysisType === 'privacy' && targetCount !== undefined && observerCount !== undefined ? (
            <span className="text-xs text-gray-500 px-1">
              <span className="text-orange-600">{targetCount}</span>
              {' / '}
              <span className="text-blue-600">{observerCount}</span>
            </span>
          ) : (
            <span className="text-xs text-gray-500 px-1">{pointCount}점</span>
          )}
          <button
            onClick={onClearAll}
            aria-label="측정점 초기화"
            className="text-xs text-gray-400 hover:text-red-500 px-1"
          >
            초기화
          </button>
        </>
      )}
    </div>
  )
}
