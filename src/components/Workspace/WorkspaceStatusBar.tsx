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

  return (
    <div
      className={`flex items-center gap-3 px-4 h-10 border-t text-xs
        transition-colors duration-500 ${stateStyles[state]}`}
    >
      {/* Icon */}
      {state === 'idle' && <Info size={15} className="opacity-50 flex-shrink-0" />}
      {state === 'uploading' && <Loader2 size={15} className="animate-spin flex-shrink-0 opacity-90" />}
      {state === 'running' && <Loader2 size={15} className="animate-spin flex-shrink-0 opacity-90" />}
      {state === 'completed' && <CheckCircle2 size={15} className="flex-shrink-0" />}
      {state === 'error' && <AlertCircle size={15} className="flex-shrink-0" />}

      {/* Message */}
      <div className="flex-1 min-w-0 font-medium">
        {state === 'idle' && (
          <span className="opacity-70">{modelInfo || message || '모델을 업로드하세요'}</span>
        )}
        {state === 'uploading' && (
          <span>
            업로드 중... {uploadProgress !== undefined && `${uploadProgress}%`}
          </span>
        )}
        {state === 'running' && (
          <span>
            {stageName || '분석 중'}
            {analysisProgress !== undefined && ` ${analysisProgress}%`}
            {etaText && (
              <span className="ml-2 opacity-75">| 남은 시간 {etaText}</span>
            )}
          </span>
        )}
        {state === 'completed' && (
          <span>
            분석 완료{completionTime && ` (${completionTime})`}
          </span>
        )}
        {state === 'error' && (
          <span className="truncate">{errorMessage || '오류 발생'}</span>
        )}
      </div>

      {/* Progress bar for uploading / running */}
      {progress !== undefined && (state === 'running' || state === 'uploading') && (
        <div className="w-36 h-2 bg-white/20 rounded-full overflow-hidden flex-shrink-0">
          <div
            className="h-full bg-white/80 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Action area — completed: link / error: retry / running: cancel */}
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
  )
}
