'use client'

import React from 'react'
import { cn } from '@/lib/cn'

// ─── Card ─────────────────────────────
// 표면 컨테이너 프리미티브. 코드베이스 전반의 `border border-gray-200 p-*`
// 패널 패턴(446회 반복)을 대체한다. 기존 디자인 언어 유지: 흰 배경,
// gray-200 보더, 직각 모서리(sharp). interactive=true는 globals의 .line-card
// 호버(accent 보더 + 살짝 떠오름)를 재현한다.

type CardElement = 'div' | 'section' | 'article'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: CardElement
  padding?: 'none' | 'sm' | 'md' | 'lg'
  interactive?: boolean
}

const PADDING: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export default function Card({
  as: Tag = 'div',
  padding = 'md',
  interactive = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700',
        PADDING[padding],
        interactive &&
          'transition-all duration-200 hover:border-red-600/30 hover:shadow-sm hover:-translate-y-px',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

// ─── 합성 보조 ─────────────────────────────

export function CardHeader({ className = '', children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between gap-3 mb-3', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm font-semibold text-gray-900 dark:text-slate-100', className)} {...rest}>
      {children}
    </h3>
  )
}

export function CardFooter({ className = '', children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center gap-2', className)} {...rest}>
      {children}
    </div>
  )
}
