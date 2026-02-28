'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

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

  const dismissToast = useCallback((id: string) => {
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
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, timeout)
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
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
