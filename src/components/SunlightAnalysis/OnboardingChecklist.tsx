'use client'

import { useState, useEffect } from 'react'
import { Check, MapPin, Crosshair, Play, X } from 'lucide-react'

interface OnboardingChecklistProps {
  hasLocation: boolean
  hasPoints: boolean
  hasResults: boolean
}

export default function OnboardingChecklist({
  hasLocation,
  hasPoints,
  hasResults,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false)

  // Auto-dismiss after first successful analysis
  useEffect(() => {
    if (hasResults) setDismissed(true)
  }, [hasResults])

  if (dismissed) return null

  const steps = [
    { key: 'location', label: '위치 설정', done: hasLocation, icon: MapPin },
    { key: 'points', label: '측정점 배치', done: hasPoints, icon: Crosshair },
    { key: 'analyze', label: '분석 실행', done: hasResults, icon: Play },
  ]

  const completedCount = steps.filter(s => s.done).length

  return (
    <div className="relative bg-gray-50 border border-gray-200 rounded p-3 mb-1">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-1.5 right-1.5 text-gray-300 hover:text-gray-500 transition-colors"
        aria-label="닫기"
      >
        <X size={12} />
      </button>

      <p className="text-[10px] font-medium text-gray-500 mb-2">
        시작 가이드 ({completedCount}/3)
      </p>
      <div className="flex items-center gap-1">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center gap-1 flex-1">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] w-full
              ${step.done
                ? 'bg-green-50 text-green-600'
                : i === completedCount
                  ? 'bg-white border border-red-200 text-red-600 font-medium'
                  : 'bg-white text-gray-400'
              }`}
            >
              {step.done ? (
                <Check size={12} className="flex-shrink-0" />
              ) : (
                <step.icon size={12} className="flex-shrink-0" />
              )}
              <span className="truncate">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-3 h-px flex-shrink-0 ${step.done ? 'bg-green-300' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
