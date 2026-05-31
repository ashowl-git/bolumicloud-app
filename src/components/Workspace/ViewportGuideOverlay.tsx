'use client'

import { useState, useEffect } from 'react'
import { MousePointerClick, X } from 'lucide-react'

interface ViewportGuideOverlayProps {
  /** Whether the guide should be visible */
  visible: boolean
  /** Guide steps to display */
  steps: { key: string; label: string }[]
  /** Called when user dismisses the guide */
  onDismiss?: () => void
}

export default function ViewportGuideOverlay({
  visible,
  steps,
  onDismiss,
}: ViewportGuideOverlayProps) {
  const [dismissed, setDismissed] = useState(false)

  // Reset dismissed state when visibility toggles back on (e.g. new session)
  useEffect(() => {
    if (visible) setDismissed(false)
  }, [visible])

  // Escape key dismisses
  useEffect(() => {
    if (!visible || dismissed) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDismissed(true)
        onDismiss?.()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [visible, dismissed, onDismiss])

  if (!visible || dismissed) return null

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div
        className="pointer-events-auto bg-black/70 backdrop-blur-sm text-white
          rounded-lg px-6 py-4 max-w-xs text-center shadow-xl
          transition-opacity duration-500"
      >
        <button
          onClick={() => { setDismissed(true); onDismiss?.() }}
          className="absolute top-2 right-2 text-white/40 hover:text-white/80 transition-colors"
          aria-label="닫기"
        >
          <X size={14} />
        </button>

        <MousePointerClick size={28} className="mx-auto mb-3 text-white/80" strokeWidth={1.5} />

        <div className="space-y-1.5">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center gap-2 justify-center text-sm">
              <span className="w-5 h-5 rounded-full bg-white/20 text-xs flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-white/90">{step.label}</span>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-white/40 mt-3">
          ESC 또는 X로 닫기
        </p>
      </div>
    </div>
  )
}
