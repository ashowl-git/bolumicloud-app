'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import BayesianOptimizationPanel from './BayesianOptimizationPanel'

interface OptimizationScenario {
  building_id: string
  original_height: number
  new_height: number
  compliance_rate: number
  compliant_count: number
  non_compliant_count: number
  delta_rate: number
}

interface OptimizationResult {
  scenarios: OptimizationScenario[]
  original_compliance_rate: number
  best_scenario: OptimizationScenario | null
  buildings_analyzed: number
  total_scenarios: number
}

interface OptimizationPanelProps {
  apiUrl: string
  sessionId: string | null
  causeResult: object | null
  analysisResult: object | null
  measurementPoints: { x: number; y: number; z: number }[]
  config: {
    latitude: number
    longitude: number
    timezone: number
    date: { month: number; day: number }
  }
}

export default function OptimizationPanel({
  apiUrl,
  sessionId,
  causeResult,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  analysisResult,
  measurementPoints,
  config,
}: OptimizationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'sweep' | 'bayesian'>('sweep')
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [heightMin, setHeightMin] = useState(10)
  const [heightMax, setHeightMax] = useState(50)
  const [heightStep, setHeightStep] = useState(5)

  const sweepPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (sweepPollRef.current) clearInterval(sweepPollRef.current)
    }
  }, [])

  const canRun = !!causeResult && !!sessionId && measurementPoints.length > 0

  const handleRun = useCallback(async () => {
    if (!canRun) return
    setIsRunning(true)
    setProgress(0)
    setResult(null)

    try {
      const res = await fetch(`${apiUrl}/optimizer/height-sweep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          cause_result: causeResult,
          latitude: config.latitude,
          longitude: config.longitude,
          timezone_offset: config.timezone / 15,
          month: config.date.month,
          day: config.date.day,
          height_min: heightMin,
          height_max: heightMax,
          height_step: heightStep,
          measurement_points: measurementPoints.map(p => ({ x: p.x, y: p.y, z: p.z })),
        }),
      })
      if (!res.ok) throw new Error('최적화 요청 실패')
      const data = await res.json()
      const sweepId = data.sweep_id

      // Poll
      if (sweepPollRef.current) clearInterval(sweepPollRef.current)
      sweepPollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`${apiUrl}/optimizer/${sweepId}/status`)
          const status = await statusRes.json()
          setProgress(status.progress || 0)

          if (status.status === 'completed') {
            clearInterval(sweepPollRef.current!)
            sweepPollRef.current = null
            const resultRes = await fetch(`${apiUrl}/optimizer/${sweepId}/result`)
            const optimResult = await resultRes.json()
            setResult(optimResult)
            setIsRunning(false)
          } else if (status.status === 'error') {
            clearInterval(sweepPollRef.current!)
            sweepPollRef.current = null
            setIsRunning(false)
          }
        } catch {
          clearInterval(sweepPollRef.current!)
          sweepPollRef.current = null
          setIsRunning(false)
        }
      }, 2000)
    } catch {
      setIsRunning(false)
    }
  }, [apiUrl, sessionId, causeResult, measurementPoints, config, heightMin, heightMax, heightStep, canRun])

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-amber-500" />
          <span className="text-sm font-medium text-gray-700">AI 최적안 검토</span>
        </div>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Tab selector */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('sweep')}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-full transition-colors ${
                activeTab === 'sweep'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              높이 스윕
            </button>
            <button
              onClick={() => setActiveTab('bayesian')}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-full transition-colors ${
                activeTab === 'bayesian'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              자동 최적화
            </button>
          </div>

          {activeTab === 'bayesian' && (
            <BayesianOptimizationPanel
              apiUrl={apiUrl}
              sessionId={sessionId}
              causeResult={causeResult}
              measurementPoints={measurementPoints}
              config={config}
            />
          )}

          {activeTab === 'sweep' && (<>
          {/* Height range inputs */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 block">최소 높이(m)</label>
              <input
                type="number"
                value={heightMin}
                onChange={(e) => setHeightMin(Number(e.target.value))}
                className="w-full text-xs border rounded px-1.5 py-1"
                min={1} max={200}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block">최대 높이(m)</label>
              <input
                type="number"
                value={heightMax}
                onChange={(e) => setHeightMax(Number(e.target.value))}
                className="w-full text-xs border rounded px-1.5 py-1"
                min={1} max={200}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block">간격(m)</label>
              <input
                type="number"
                value={heightStep}
                onChange={(e) => setHeightStep(Number(e.target.value))}
                className="w-full text-xs border rounded px-1.5 py-1"
                min={1} max={50}
              />
            </div>
          </div>

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={!canRun || isRunning}
            className="w-full py-1.5 text-xs font-medium rounded-md transition-colors
              bg-amber-500 text-white hover:bg-amber-600
              disabled:bg-gray-200 disabled:text-gray-400"
          >
            {isRunning ? `분석 중... ${progress.toFixed(0)}%` : '높이 스윕 실행'}
          </button>

          {!canRun && !isRunning && (
            <p className="text-[10px] text-gray-400">원인 분석 완료 후 사용 가능</p>
          )}

          {/* Results */}
          {result && result.best_scenario && (
            <div className="space-y-2">
              {/* Best scenario highlight */}
              <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
                <div className="text-[10px] text-amber-600 font-medium mb-1">최적 시나리오</div>
                <div className="text-xs text-gray-800">
                  {result.best_scenario.building_id}{' '}
                  <span className="text-gray-400">
                    {result.best_scenario.original_height}m
                  </span>
                  {' → '}
                  <span className="font-semibold">{result.best_scenario.new_height}m</span>
                </div>
                <div className="text-xs mt-0.5">
                  적합률{' '}
                  <span className="text-gray-400">{result.original_compliance_rate}%</span>
                  {' → '}
                  <span className="font-semibold text-green-600">
                    {result.best_scenario.compliance_rate}%
                  </span>
                  <span className="text-green-500 ml-1">
                    (+{result.best_scenario.delta_rate}%)
                  </span>
                </div>
              </div>

              {/* Scenarios table */}
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-[10px]">
                  <thead className="text-gray-400 sticky top-0 bg-white">
                    <tr>
                      <th className="text-left py-0.5">건물</th>
                      <th className="text-right">높이</th>
                      <th className="text-right">적합률</th>
                      <th className="text-right">변화</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    {result.scenarios.map((s, i) => (
                      <tr key={i} className={s.delta_rate > 0 ? 'bg-green-50/50' : ''}>
                        <td className="py-0.5">{s.building_id}</td>
                        <td className="text-right">{s.new_height}m</td>
                        <td className="text-right">{s.compliance_rate}%</td>
                        <td className={`text-right ${s.delta_rate > 0 ? 'text-green-600' : s.delta_rate < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                          {s.delta_rate > 0 ? '+' : ''}{s.delta_rate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </>)}
        </div>
      )}
    </div>
  )
}
