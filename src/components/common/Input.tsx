'use client'

import React, { useId } from 'react'
import { cn } from '@/lib/cn'

// ─── Input ─────────────────────────────
// 텍스트 입력 프리미티브. globals의 .input-base를 React로 응집하고
// label/hint/error/unit + 적절한 aria 연결을 추가한다.
// unit 접미사는 위도/경도·길이 등 단위 누락 문제를 구조적으로 해결한다.

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  /** 우측 단위 표시 (예: '°', 'm', 'mm') */
  unit?: string
}

export default function Input({
  label,
  hint,
  error,
  unit,
  id,
  required,
  className = '',
  ...rest
}: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block mb-1 text-xs font-medium text-gray-700 dark:text-slate-300">
          {label}
          {required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 border transition-colors',
            'hover:border-gray-300 dark:hover:border-slate-600',
            'focus:outline-none focus-visible:ring-1 focus-visible:ring-red-600/30 focus:border-red-600/40',
            'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
            error ? 'border-red-500' : 'border-gray-200 dark:border-slate-700',
            unit ? 'pr-9' : '',
            className,
          )}
          {...rest}
        />
        {unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {unit}
          </span>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-gray-400">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
