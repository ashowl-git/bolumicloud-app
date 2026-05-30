'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, X, Upload, MousePointerClick, Play } from 'lucide-react'

// ─── WorkspaceGuide ─────────────────────────────
// 분석 워크스페이스의 사용 안내. 측정점 배치·분석 실행 흐름을 항상 접근 가능한
// 도움말로 제공해 첫 사용자의 "어떻게 하지?" 마찰을 줄인다.

const STEPS = [
  {
    icon: Upload,
    title: '1. 3D 모델 업로드',
    desc: 'OBJ 또는 Sanalyst SN5F 파일을 드래그하거나 클릭해 업로드합니다. (MTL 동반 시 함께 선택)',
  },
  {
    icon: MousePointerClick,
    title: '2. 측정점 배치',
    desc: '툴바에서 "측정점 추가" 모드를 켠 뒤 건물 표면이나 지면을 클릭합니다. "영역" 모드로 사각 범위를 그려 격자 측정점을 한 번에 생성할 수도 있습니다.',
  },
  {
    icon: Play,
    title: '3. 분석 실행',
    desc: '분석을 실행하면 일조시간 계산·법규 판정·보고서(CSV/Excel)가 생성됩니다.',
  },
]

export default function WorkspaceGuide() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="사용 안내"
        title="사용 안내"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded transition-colors
          text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-100
          hover:bg-gray-100 dark:hover:bg-slate-700"
      >
        <HelpCircle size={14} />
        <span className="hidden sm:inline">안내</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="분석 워크플로우 안내"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md p-5 rounded-lg shadow-xl
            bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">분석 워크플로우 안내</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <ol className="space-y-3">
              {STEPS.map((s) => {
                const Icon = s.icon
                return (
                  <li key={s.title} className="flex gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-lg
                      bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400">
                      <Icon size={16} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{s.title}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      )}
    </>
  )
}
