'use client'

import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={24} strokeWidth={1.2} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-700 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-gray-400 text-center max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 border border-gray-200 hover:border-red-600/30 px-5 py-2
            text-sm text-gray-700 hover:text-red-600 transition-all duration-300"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
