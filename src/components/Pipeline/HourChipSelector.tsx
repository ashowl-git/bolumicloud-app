'use client'

interface HourChipSelectorProps {
  selectedHours: number[]
  onChange: (hours: number[]) => void
  disabled?: boolean
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 5) // 5~20

export default function HourChipSelector({ selectedHours, onChange, disabled }: HourChipSelectorProps) {
  const toggle = (hour: number) => {
    if (disabled) return
    if (selectedHours.includes(hour)) {
      onChange(selectedHours.filter((h) => h !== hour))
    } else {
      onChange([...selectedHours, hour].sort((a, b) => a - b))
    }
  }

  const selectAll = () => {
    if (disabled) return
    onChange([...HOURS])
  }

  const clearAll = () => {
    if (disabled) return
    onChange([])
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {HOURS.map((hour) => {
          const isSelected = selectedHours.includes(hour)
          return (
            <button
              key={hour}
              type="button"
              onClick={() => toggle(hour)}
              disabled={disabled}
              className={`px-3 py-1.5 text-sm cursor-pointer transition-all duration-300 ${
                isSelected
                  ? 'border border-red-600 bg-red-50 text-red-600'
                  : 'border border-gray-200 text-gray-700 hover:border-gray-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {hour}:00
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <span className="text-xs text-gray-500">{selectedHours.length}개 시간 선택됨</span>
        <button
          type="button"
          onClick={selectAll}
          disabled={disabled}
          className="text-xs text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          전체 선택
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={disabled}
          className="text-xs text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          초기화
        </button>
      </div>
    </div>
  )
}
