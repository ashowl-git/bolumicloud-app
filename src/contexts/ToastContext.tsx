'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, type ReactNode } from 'react'
import { type ApiError } from '@/lib/api'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  type: 'error' | 'success' | 'warning' | 'info'
  message: string
  action?: ToastAction
}

interface ShowToastOptions {
  type: Toast['type']
  message: string
  duration?: number
  action?: ToastAction
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (options: ShowToastOptions) => void
  showApiError: (error: ApiError) => void
  dismissToast: (id: string) => void
}

const DURATION_MAP: Record<Toast['type'], number> = {
  error: 8000,
  success: 3000,
  warning: 5000,
  info: 5000,
}

const MAX_TOASTS = 3

const ToastContext = createContext<ToastContextType | null>(null)

let toastCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timerMap = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Cleanup all timeouts on unmount
  useEffect(() => {
    const map = timerMap.current
    return () => {
      map.forEach((timerId) => clearTimeout(timerId))
      map.clear()
    }
  }, [])

  const dismissToast = useCallback((id: string) => {
    const timerId = timerMap.current.get(id)
    if (timerId) {
      clearTimeout(timerId)
      timerMap.current.delete(id)
    }
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback(({ type, message, duration, action }: ShowToastOptions) => {
    const id = `toast-${++toastCounter}`
    const toast: Toast = { id, type, message, action }

    setToasts(prev => {
      const next = [...prev, toast]
      return next.length > MAX_TOASTS ? next.slice(-MAX_TOASTS) : next
    })

    const timeout = duration ?? DURATION_MAP[type]
    const timerId = setTimeout(() => {
      timerMap.current.delete(id)
      setToasts(prev => prev.filter(t => t.id !== id))
    }, timeout)
    timerMap.current.set(id, timerId)
  }, [])

  const showApiError = useCallback((error: ApiError) => {
    // 401/403 만 실제 복구 동작(재로그인 위해 reload)을 가진다.
    // 그 외(413/429/5xx)는 클릭해도 할 일이 없으므로 action 버튼을 만들지 않고
    // recoveryHint 는 안내 메시지 텍스트로만 합쳐서 표시한다. (죽은 버튼 제거)
    const isAuthError = error.status === 401 || error.status === 403
    if (isAuthError && error.recoveryHint) {
      showToast({
        type: 'error',
        message: error.userMessage,
        action: {
          label: error.recoveryHint,
          onClick: () => {
            window.location.reload()
          },
        },
      })
      return
    }

    const message = error.recoveryHint
      ? `${error.userMessage} ${error.recoveryHint}`
      : error.userMessage
    showToast({ type: 'error', message })
  }, [showToast])

  const value = useMemo(() => ({ toasts, showToast, showApiError, dismissToast }), [toasts, showToast, showApiError, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
