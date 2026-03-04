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
    showToast({
      type: 'error',
      message: error.userMessage,
      ...(error.recoveryHint && {
        action: {
          label: error.recoveryHint,
          onClick: () => {
            if (error.status === 401 || error.status === 403) {
              window.location.reload()
            }
          },
        },
      }),
    })
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
