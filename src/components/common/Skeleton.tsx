'use client'

interface SkeletonProps {
  variant?: 'text' | 'card' | 'circle' | 'custom'
  width?: string
  height?: string
  className?: string
  /** Number of text lines to render (only for variant="text") */
  lines?: number
  /** Whether the last text line should be shorter */
  lastLineShort?: boolean
}

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  lines = 1,
  lastLineShort = true,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded'

  if (variant === 'circle') {
    const size = width || '40px'
    return (
      <div
        className={`${baseClasses} rounded-full flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  if (variant === 'card') {
    return (
      <div
        className={`${baseClasses} rounded-none ${className}`}
        style={{ width: width || '100%', height: height || '120px' }}
      />
    )
  }

  if (variant === 'custom') {
    return (
      <div
        className={`${baseClasses} ${className}`}
        style={{ width: width || '100%', height: height || '16px' }}
      />
    )
  }

  // variant === 'text'
  if (lines === 1) {
    return (
      <div
        className={`${baseClasses} ${className}`}
        style={{ width: width || '100%', height: height || '14px' }}
      />
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => {
        const isLast = i === lines - 1
        const lineWidth = isLast && lastLineShort ? '60%' : '100%'
        return (
          <div
            key={i}
            className={baseClasses}
            style={{ width: lineWidth, height: height || '14px' }}
          />
        )
      })}
    </div>
  )
}
