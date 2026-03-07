'use client'

import { CloudUpload, Crosshair, Play, BarChart3, Check } from 'lucide-react'

export type WorkspaceStep = 'upload' | 'configure' | 'analyze' | 'results'

interface WorkspaceProgressStepperProps {
  currentStep: WorkspaceStep
  /** Whether analysis has completed at least once (enables clicking back to results) */
  hasResults?: boolean
}

const STEPS: { key: WorkspaceStep; label: string; icon: typeof CloudUpload }[] = [
  { key: 'upload', label: '모델 업로드', icon: CloudUpload },
  { key: 'configure', label: '측정점 배치', icon: Crosshair },
  { key: 'analyze', label: '분석 실행', icon: Play },
  { key: 'results', label: '결과 확인', icon: BarChart3 },
]

const STEP_INDEX: Record<WorkspaceStep, number> = {
  upload: 0,
  configure: 1,
  analyze: 2,
  results: 3,
}

export default function WorkspaceProgressStepper({
  currentStep,
}: WorkspaceProgressStepperProps) {
  const currentIdx = STEP_INDEX[currentStep]

  return (
    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg
      border border-gray-200 shadow-sm px-3 py-1.5 select-none">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIdx
        const isCurrent = i === currentIdx
        const isFuture = i > currentIdx
        const Icon = step.icon

        return (
          <div key={step.key} className="flex items-center gap-1">
            {/* Step pill */}
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium
                transition-all duration-300
                ${isCurrent
                  ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                  : isCompleted
                  ? 'text-emerald-600'
                  : 'text-gray-400'
                }`}
            >
              {isCompleted ? (
                <Check size={12} strokeWidth={2.5} className="text-emerald-500" />
              ) : (
                <Icon
                  size={12}
                  strokeWidth={isCurrent ? 2 : 1.5}
                  className={isCurrent ? 'text-blue-600' : ''}
                />
              )}
              <span className="hidden sm:inline whitespace-nowrap">{step.label}</span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={`w-4 h-px transition-colors duration-300
                  ${i < currentIdx ? 'bg-emerald-300' : isFuture ? 'bg-gray-200' : 'bg-blue-200'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
