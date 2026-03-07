'use client'

import { Loader2, CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export type StatusBarState = 'idle' | 'uploading' | 'running' | 'completed' | 'error'

interface WorkspaceStatusBarProps {
  state: StatusBarState
  /** Model info for idle state */
  modelInfo?: string
  /** Upload progress (0-100) */
  uploadProgress?: number
  /** Analysis stage name */
  stageName?: string
  /** Analysis overall progress (0-100) */
  analysisProgress?: number
  /** Estimated remaining time */
  etaText?: string
  /** Completion time */
  completionTime?: string
  /** Error message */
  errorMessage?: string
  /** Custom message */
  message?: string
  /** Callback: scroll side panel to results */
  onViewResults?: () => void
  /** Callback: retry after error (re-run analysis) */
  onRetry?: () => void
  /** Callback: reset to initial state (re-upload) */
  onReset?: () => void
  /** Callback: cancel running analysis */
  onCancel?: () => void
}

const stateStyles: Record<StatusBarState, string> = {
  idle: 'bg-gray-100/95 border-gray-200 text-gray-600',
  uploading: 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-600 text-white',
  running: 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-700 text-white animate-status-pulse',
  completed: 'bg-emerald-500 border-emerald-600 text-white',
  error: 'bg-red-500 border-red-600 text-white',
}

export default function WorkspaceStatusBar({
  state,
  modelInfo,
  uploadProgress,
  stageName,
  analysisProgress,
  etaText,
  completionTime,
  errorMessage,
  message,
  onViewResults,
  onRetry,
  onReset,
  onCancel,
}: WorkspaceStatusBarProps) {
  const progress =
    state === 'uploading' ? uploadProgress :
    state === 'running' ? analysisProgress :
    undefined

  const isExpanded = state === 'running' || state === 'uploading'

  return (
    <div
      className={`border-t text-xs transition-all duration-500 ${stateStyles[state]}
        ${isExpanded ? 'px-4 py-2.5' : 'px-4 h-10 flex items-center gap-3'}`}
    >
      {isExpanded ? (
        /* ── Expanded layout for running/uploading ── */
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <Loader2 size={15} className="animate-spin flex-shrink-0 opacity-90" />
            <div className="flex-1 min-w-0 font-medium">
              {state === 'uploading' ? (
                <span>업로드 중... {uploadProgress !== undefined && `${uploadProgress}%`}</span>
              ) : (
                <span>
                  {stageName || '분석 중'}
                  {analysisProgress !== undefined && ` ${analysisProgress}%`}
                </span>
              )}
            </div>
            {etaText && state === 'running' && (
              <span className="text-[11px] opacity-75 flex-shrink-0">남은 시간 {etaText}</span>
            )}
            {state === 'running' && onCancel && (
              <button
                onClick={onCancel}
                className="p-1 bg-white/15 hover:bg-white/25 rounded transition-colors flex-shrink-0"
                title="분석 취소"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {progress !== undefined && (
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        /* ── Compact layout for idle/completed/error ── */
        <>
          {/* Icon */}
          {state === 'idle' && <Info size={15} className="opacity-50 flex-shrink-0" />}
          {state === 'completed' && <CheckCircle2 size={15} className="flex-shrink-0" />}
          {state === 'error' && <AlertCircle size={15} className="flex-shrink-0" />}

          {/* Message */}
          <div className="flex-1 min-w-0 font-medium">
            {state === 'idle' && (
              <span className="opacity-70">{modelInfo || message || '모델을 업로드하세요'}</span>
            )}
            {state === 'completed' && (
              <span>분석 완료{completionTime && ` (${completionTime})`}</span>
            )}
            {state === 'error' && (
              <span className="truncate">{errorMessage || '오류 발생'}</span>
            )}
          </div>

          {/* Action area */}
          {state === 'completed' && onViewResults && (
            <button
              onClick={onViewResults}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-[11px]
                font-medium transition-colors flex-shrink-0"
            >
              결과 보기
            </button>
          )}
          {state === 'error' && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-[11px]
                    font-medium transition-colors"
                >
                  재시도
                </button>
              )}
              {onReset && (
                <button
                  onClick={onReset}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-[11px]
                    font-medium transition-colors"
                >
                  초기화
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
