'use client'

import { useState, useCallback } from 'react'
import { Star, Building2, Users, ClipboardCheck, BarChart3, AlertCircle, RotateCcw, Loader2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { usePerformanceGradeContext } from '@/contexts/PerformanceGradeContext'
import type { LocalizedText } from '@/lib/types/i18n'

import GradeResultCard from './GradeResultCard'
import GradeSummary from './GradeSummary'

const txt = {
  title: { ko: '주택성능등급', en: 'Housing Performance Grade' } as LocalizedText,
  subtitle: { ko: '공동주택 16개 항목 성능등급 산정', en: '16-item housing performance grading' } as LocalizedText,
  step1: { ko: '단지 정보', en: 'Complex Info' } as LocalizedText,
  step2: { ko: '건물/세대', en: 'Buildings' } as LocalizedText,
  step3: { ko: '등급 입력', en: 'Grades' } as LocalizedText,
  step4: { ko: '결과', en: 'Results' } as LocalizedText,
  complexName: { ko: '단지명', en: 'Complex Name' } as LocalizedText,
  address: { ko: '주소', en: 'Address' } as LocalizedText,
  totalUnits: { ko: '총 세대수', en: 'Total Units' } as LocalizedText,
  siteArea: { ko: '대지면적 (m2)', en: 'Site Area (m2)' } as LocalizedText,
  buildingName: { ko: '동명', en: 'Building' } as LocalizedText,
  stories: { ko: '층수', en: 'Stories' } as LocalizedText,
  height: { ko: '높이(m)', en: 'Height(m)' } as LocalizedText,
  addBuilding: { ko: '건물 추가', en: 'Add Building' } as LocalizedText,
  next: { ko: '다음', en: 'Next' } as LocalizedText,
  prev: { ko: '이전', en: 'Back' } as LocalizedText,
  calculate: { ko: '등급 산출', en: 'Calculate' } as LocalizedText,
  calculating: { ko: '산출 중...', en: 'Calculating...' } as LocalizedText,
  reset: { ko: '초기화', en: 'Reset' } as LocalizedText,
  minUnitsWarning: { ko: '500세대 이상 공동주택만 대상입니다', en: 'Minimum 500 units required' } as LocalizedText,
}

const STEPS = [
  { id: 1, label: txt.step1, icon: Building2 },
  { id: 2, label: txt.step2, icon: Users },
  { id: 3, label: txt.step3, icon: ClipboardCheck },
  { id: 4, label: txt.step4, icon: BarChart3 },
]

export default function PerformanceGradeTab() {
  const { t } = useLocalizedText()
  const {
    phase, complexInfo, buildings, grades,
    results, error,
    setComplexInfo, setBuildings, setGrade,
    calculate, reset,
  } = usePerformanceGradeContext()

  const [step, setStep] = useState(1)

  const handleAddBuilding = useCallback(() => {
    const id = `bldg-${buildings.length + 1}`
    setBuildings([
      ...buildings,
      { id, name: `${100 + buildings.length + 1}동`, stories: 15, height: 45, orientation: 0 },
    ])
  }, [buildings, setBuildings])

  const handleRemoveBuilding = useCallback((id: string) => {
    setBuildings(buildings.filter((b) => b.id !== id))
  }, [buildings, setBuildings])

  const handleCalculate = useCallback(async () => {
    await calculate()
    setStep(4)
  }, [calculate])

  const handleReset = useCallback(() => {
    reset()
    setStep(1)
  }, [reset])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star size={28} strokeWidth={1.2} className="text-gray-400" />
          <div>
            <h1 className="text-2xl font-light text-gray-900">{t(txt.title)}</h1>
            <p className="text-sm text-gray-500">{t(txt.subtitle)}</p>
          </div>
        </div>
        {step > 1 && (
          <button onClick={handleReset} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors">
            <RotateCcw size={14} /> {t(txt.reset)}
          </button>
        )}
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => { if (s.id <= step || (s.id === 4 && results)) setStep(s.id) }}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm transition-all duration-300 ${
                step === s.id
                  ? 'text-red-600 border-b-2 border-red-600'
                  : s.id < step || (s.id === 4 && results)
                  ? 'text-gray-700 cursor-pointer hover:text-red-600'
                  : 'text-gray-400'
              }`}
            >
              <s.icon size={14} />
              {t(s.label)}
            </button>
            {idx < STEPS.length - 1 && <span className="text-gray-300">—</span>}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Complex Info */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="border border-gray-200 p-6 space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t(txt.complexName)}</label>
                <input
                  type="text"
                  value={complexInfo.name}
                  onChange={(e) => setComplexInfo({ name: e.target.value })}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-red-600/30"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{t(txt.address)}</label>
                <input
                  type="text"
                  value={complexInfo.address}
                  onChange={(e) => setComplexInfo({ address: e.target.value })}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-red-600/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t(txt.totalUnits)}</label>
                  <input
                    type="number"
                    min={500}
                    value={complexInfo.totalUnits}
                    onChange={(e) => setComplexInfo({ totalUnits: Number(e.target.value) })}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-red-600/30"
                  />
                  {complexInfo.totalUnits < 500 && (
                    <p className="text-xs text-red-500 mt-1">{t(txt.minUnitsWarning)}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{t(txt.siteArea)}</label>
                  <input
                    type="number"
                    value={complexInfo.siteArea}
                    onChange={(e) => setComplexInfo({ siteArea: Number(e.target.value) })}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-red-600/30"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={complexInfo.totalUnits < 500 || !complexInfo.name}
                className="border border-gray-200 px-6 py-2.5 text-sm text-gray-700 hover:text-red-600 hover:border-red-600/30 transition-all duration-300 disabled:opacity-50"
              >
                {t(txt.next)}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Buildings */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">{t(txt.step2)}</h3>
                <button
                  onClick={handleAddBuilding}
                  className="border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:text-red-600 hover:border-red-600/30 transition-all"
                >
                  + {t(txt.addBuilding)}
                </button>
              </div>

              {buildings.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 text-left text-xs text-gray-500">{t(txt.buildingName)}</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">{t(txt.stories)}</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">{t(txt.height)}</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildings.map((b) => (
                      <tr key={b.id} className="border-b border-gray-100">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={b.name}
                            onChange={(e) => setBuildings(buildings.map((bb) => bb.id === b.id ? { ...bb, name: e.target.value } : bb))}
                            className="border border-gray-200 px-2 py-1 text-sm w-full focus:outline-none focus:border-red-600/30"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={b.stories}
                            onChange={(e) => setBuildings(buildings.map((bb) => bb.id === b.id ? { ...bb, stories: Number(e.target.value) } : bb))}
                            className="border border-gray-200 px-2 py-1 text-sm w-20 focus:outline-none focus:border-red-600/30"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={b.height}
                            onChange={(e) => setBuildings(buildings.map((bb) => bb.id === b.id ? { ...bb, height: Number(e.target.value) } : bb))}
                            className="border border-gray-200 px-2 py-1 text-sm w-20 focus:outline-none focus:border-red-600/30"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => handleRemoveBuilding(b.id)} className="text-gray-400 hover:text-red-600">
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">건물을 추가하세요</p>
              )}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="border border-gray-200 px-6 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                {t(txt.prev)}
              </button>
              <button onClick={() => setStep(3)} className="border border-gray-200 px-6 py-2.5 text-sm text-gray-700 hover:text-red-600 hover:border-red-600/30 transition-all duration-300">
                {t(txt.next)}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Grade Entry */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <GradeResultCard
              grades={grades}
              onGradeChange={setGrade}
              disabled={phase === 'calculating'}
            />
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="border border-gray-200 px-6 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                {t(txt.prev)}
              </button>
              <button
                onClick={handleCalculate}
                disabled={phase === 'calculating'}
                className="border border-gray-200 px-6 py-2.5 text-sm text-gray-700 hover:text-red-600 hover:border-red-600/30 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
              >
                {phase === 'calculating' && <Loader2 size={14} className="animate-spin" />}
                {phase === 'calculating' ? t(txt.calculating) : t(txt.calculate)}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Results */}
        {step === 4 && results && (
          <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <GradeSummary result={results} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
