'use client'

import React from 'react'
import { cn } from '@/lib/cn'

// ─── Badge ─────────────────────────────
// 상태/태그 라벨 프리미티브. 코드베이스 전반의 인라인
// `border ... px-2 py-0.5 text-xs` 배지 패턴을 대체한다.

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent'
  size?: 'sm' | 'md'
  /** 좌측 상태 점 표시 */
  dot?: boolean
}

const VARIANT: Record<NonNullable<BadgeProps['variant']>, string> = {
  neutral: 'bg-gray-100 text-gray-600 border-gray-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  accent: 'bg-red-50 text-red-600 border-red-200',
}

const DOT_COLOR: Record<NonNullable<BadgeProps['variant']>, string> = {
  neutral: 'bg-gray-400',
  info: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  accent: 'bg-red-600',
}

const SIZE: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
}

export default function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border font-medium whitespace-nowrap',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', DOT_COLOR[variant])} aria-hidden="true" />}
      {children}
    </span>
  )
}
