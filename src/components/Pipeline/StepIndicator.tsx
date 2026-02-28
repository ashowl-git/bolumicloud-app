'use client'

import { Upload, Settings, ClipboardCheck, Loader2, BarChart3, CheckCircle2 } from 'lucide-react'

const STEPS = [
  { label: 'Files', icon: Upload },
  { label: 'Settings', icon: Settings },
  { label: 'Review', icon: ClipboardCheck },
  { label: 'Progress', icon: Loader2 },
  { label: 'Results', icon: BarChart3 },
]

interface StepIndicatorProps {
  currentStep: number
  completedSteps: number[]
}

export default function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-10">
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1
        const isCompleted = completedSteps.includes(stepNum)
        const isActive = stepNum === currentStep
        const Icon = step.icon

        return (
          <div key={stepNum} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-600 text-white'
                    : isActive
                    ? 'border-2 border-red-600 text-red-600 ring-2 ring-red-600/20'
                    : 'border border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={18} strokeWidth={2} />
                ) : (
                  <Icon size={16} strokeWidth={1.5} />
                )}
              </div>
              <span
                className={`text-xs mt-1.5 ${
                  isActive ? 'text-red-600 font-medium' : isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {idx < STEPS.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-1 transition-all duration-300 ${
                  completedSteps.includes(stepNum) ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
