'use client'

import React, { useId } from 'react'
import { cn } from '@/lib/cn'

// ─── Select ─────────────────────────────
// 드롭다운 프리미티브. globals의 .select-base(커스텀 chevron 포함)를
// React로 응집하고 label/hint/error + aria를 추가한다.

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
}

// globals.css .select-base 와 동일한 chevron (gray-400 stroke)
const CHEVRON =
  "appearance-none bg-no-repeat bg-[length:1rem] bg-[position:right_0.5rem_center] pr-8 " +
  "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')]"

export default function Select({
  label,
  hint,
  error,
  id,
  required,
  className = '',
  children,
  ...rest
}: SelectProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  const describedBy = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block mb-1 text-xs font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={selectId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full bg-white px-3 py-2 text-sm text-gray-900 border transition-colors cursor-pointer',
          'hover:border-gray-300',
          'focus:outline-none focus-visible:ring-1 focus-visible:ring-red-600/30 focus:border-red-600/40',
          'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
          error ? 'border-red-500' : 'border-gray-200',
          CHEVRON,
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {error ? (
        <p id={`${selectId}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${selectId}-hint`} className="mt-1 text-xs text-gray-400">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
