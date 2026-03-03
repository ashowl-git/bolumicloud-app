'use client'

import { useEffect, useState, useRef } from 'react'
import { MousePointer2, Trash2 } from 'lucide-react'
import type { InteractionMode } from '@/components/shared/3d/interaction/types'

export interface ToolbarModeConfig {
  id: InteractionMode
  icon: typeof MousePointer2
  label: string
  shortcut?: string
}

interface WorkspaceToolbarProps {
  modes: ToolbarModeConfig[]
  activeMode: InteractionMode
  onModeChange: (mode: InteractionMode) => void
  pointCount?: number
  onClearAll?: () => void
  /** Extra controls (e.g. privacy role toggle) */
  extraControls?: React.ReactNode
}

// Cursor styles per mode
const MODE_CURSORS: Record<InteractionMode, string> = {
  navigate: 'default',
  place_point: 'crosshair',
  place_area: 'crosshair',
  delete: 'not-allowed',
  select: 'pointer',
  transform: 'move',
}

export default function WorkspaceToolbar({
  modes,
  activeMode,
  onModeChange,
  pointCount,
  onClearAll,
  extraControls,
}: WorkspaceToolbarProps) {
  const [modeToast, setModeToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevMode = useRef(activeMode)

  // Mode change toast
  useEffect(() => {
    if (prevMode.current !== activeMode) {
      const matched = modes.find((m) => m.id === activeMode)
      if (matched) {
        setModeToast(matched.label)
        if (toastTimer.current) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => setModeToast(null), 1200)
      }
      prevMode.current = activeMode
    }
  }, [activeMode, modes])

  // Cursor feedback on canvas
  useEffect(() => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.style.cursor = MODE_CURSORS[activeMode] ?? 'default'
    }
    return () => {
      if (canvas) canvas.style.cursor = 'default'
    }
  }, [activeMode])

  // Keyboard shortcuts: V=navigate, P=point, A=area, D=delete, Esc=navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const shortcutMode = modes.find((m) => m.shortcut?.toLowerCase() === e.key.toLowerCase())
      if (shortcutMode) {
        e.preventDefault()
        onModeChange(shortcutMode.id)
        return
      }
      if (e.key === 'Escape') {
        onModeChange('navigate')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modes, onModeChange])

  return (
    <>
      <div className="flex items-center gap-0.5 bg-white/95 backdrop-blur-sm
        border border-gray-200 rounded-lg p-0.5 shadow-md"
      >
        {/* Mode buttons */}
        {modes.map(({ id, icon: Icon, label, shortcut }) => {
          const isActive = activeMode === id
          return (
            <div key={id} className="relative group">
              <button
                onClick={() => onModeChange(id)}
                className={`
                  relative flex flex-col items-center gap-0
                  rounded-md transition-all duration-150
                  ${isActive
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                  }
                  ${isActive ? 'px-2 py-1' : 'p-1.5'}
                `}
              >
                <Icon size={16} />
                {isActive && (
                  <span className="text-[9px] leading-none font-medium mt-0.5 whitespace-nowrap">
                    {label}
                  </span>
                )}
              </button>
              {/* Enhanced tooltip with shortcut */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5
                opacity-0 group-hover:opacity-100 pointer-events-none
                transition-opacity duration-150 z-50"
              >
                <div className="bg-gray-900 text-white text-[11px] leading-tight
                  px-2 py-1.5 rounded-md shadow-lg whitespace-nowrap
                  flex items-center gap-1.5"
                >
                  <span>{label}</span>
                  {shortcut && (
                    <kbd className="bg-gray-700 text-gray-200 text-[10px]
                      px-1 py-0.5 rounded font-mono min-w-[18px] text-center"
                    >
                      {shortcut}
                    </kbd>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Extra controls */}
        {extraControls}

        {/* Point count + clear */}
        {pointCount !== undefined && pointCount > 0 && (
          <>
            <div className="w-px h-5 bg-gray-200 mx-0.5" />
            <span className="text-xs text-gray-500 px-1 tabular-nums">{pointCount}점</span>
            {onClearAll && (
              <div className="relative group">
                <button
                  onClick={onClearAll}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
                >
                  <Trash2 size={14} />
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5
                  opacity-0 group-hover:opacity-100 pointer-events-none
                  transition-opacity duration-150 z-50"
                >
                  <div className="bg-gray-900 text-white text-[11px] px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                    전체 삭제
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mode change toast */}
      {modeToast && (
        <div className="absolute top-14 left-3 z-20
          bg-gray-900/80 text-white text-xs px-3 py-1.5 rounded-md
          animate-fade-in-out pointer-events-none"
        >
          {modeToast} 모드
        </div>
      )}
    </>
  )
}

/**
 * Keyboard shortcut help overlay.
 * Rendered separately by the workspace, toggled by "?" key.
 */
export function KeyboardShortcutOverlay({
  modes,
  onClose,
}: {
  modes: ToolbarModeConfig[]
  onClose: () => void
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-5 max-w-xs w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          단축키 안내
        </h3>
        <div className="space-y-2">
          {/* Mode shortcuts */}
          {modes.map(({ label, shortcut }) => (
            shortcut && (
              <div key={shortcut} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <kbd className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded font-mono border border-gray-200">
                  {shortcut}
                </kbd>
              </div>
            )
          ))}
          <div className="border-t border-gray-100 my-2" />
          {/* Global shortcuts */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">탐색 모드로 복귀</span>
            <kbd className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded font-mono border border-gray-200">
              Esc
            </kbd>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">패널 열기/닫기</span>
            <kbd className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded font-mono border border-gray-200">
              Tab
            </kbd>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">그림자 재생/정지</span>
            <kbd className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded font-mono border border-gray-200">
              Space
            </kbd>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">단축키 도움말</span>
            <kbd className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded font-mono border border-gray-200">
              ?
            </kbd>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          닫기 (Esc)
        </button>
      </div>
    </div>
  )
}
