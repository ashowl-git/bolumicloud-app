'use client'

import React from 'react'

// ─── IconButton ─────────────────────────────

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  'aria-label': string
  tooltip?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES: Record<NonNullable<IconButtonProps['size']>, string> = {
  sm: 'p-1',
  md: 'p-1.5',
  lg: 'p-2',
}

export default function IconButton({
  icon,
  'aria-label': ariaLabel,
  tooltip,
  size = 'md',
  className = '',
  ...rest
}: IconButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      title={tooltip ?? ariaLabel}
      className={[
        'inline-flex items-center justify-center rounded transition-colors',
        'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
        'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        SIZE_CLASSES[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {icon}
    </button>
  )
}
