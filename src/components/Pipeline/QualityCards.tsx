'use client'

import { QUALITY_DETAILS } from '@/lib/types/pipeline'

interface QualityCardsProps {
  selected: 'low' | 'medium' | 'high'
  onChange: (q: 'low' | 'medium' | 'high') => void
  disabled?: boolean
}

const LABELS: Record<'low' | 'medium' | 'high', { title: string; time: string }> = {
  low:    { title: 'Low',    time: '~30s / render' },
  medium: { title: 'Medium', time: '~2min / render' },
  high:   { title: 'High',   time: '~8min / render' },
}

export default function QualityCards({ selected, onChange, disabled }: QualityCardsProps) {
  const levels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high']

  return (
    <div className="grid grid-cols-3 gap-4">
      {levels.map((level) => {
        const isSelected = selected === level
        const detail = QUALITY_DETAILS[level]
        const label = LABELS[level]

        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            disabled={disabled}
            className={`p-4 text-left cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'border-2 border-red-600 bg-red-50'
                : 'border-2 border-gray-200 hover:border-gray-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <p className={`text-sm font-medium ${isSelected ? 'text-red-600' : 'text-gray-900'}`}>
              {label.title}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {detail.resolution} x {detail.resolution}
            </p>
            <p className="text-xs text-gray-500">ab{detail.ab}</p>
            <p className="text-xs text-gray-400 mt-2">{label.time}</p>
          </button>
        )
      })}
    </div>
  )
}
