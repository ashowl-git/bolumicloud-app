'use client'

const STEP_LABELS = ['Files', 'Settings', 'Review', 'Progress', 'Results']

interface StepIndicatorProps {
  currentStep: number
  completedSteps: number[]
}

export default function StepIndicator({ currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center mb-10">
      {STEP_LABELS.map((label, idx) => {
        const step = idx + 1
        const isCompleted = completedSteps.includes(step)
        const isActive = step === currentStep

        return (
          <div key={step} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-600 text-white'
                    : isActive
                    ? 'border-2 border-red-600 text-red-600'
                    : 'border border-gray-300 text-gray-400'
                }`}
              >
                {isCompleted ? '\u2713' : step}
              </div>
              <span
                className={`text-xs mt-1.5 ${
                  isActive ? 'text-red-600 font-medium' : isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>

            {/* Connecting line */}
            {idx < STEP_LABELS.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-1 transition-all duration-300 ${
                  completedSteps.includes(step) ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
