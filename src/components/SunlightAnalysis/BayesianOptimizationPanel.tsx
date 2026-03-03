'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Settings, ChevronDown, ChevronUp, Play, Loader2, Trophy, Clock } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CauseResult = any

interface VariableConfig {
  building_id: string
  original_height: number
  height_range: [number, number] | null
  translate_range: number | null
  rotation_enabled: boolean
}

interface TrialResult {
  trial_number: number
  params: Record<string, number>
  compliance_rate: number
  delta_rate: number
  feasible: boolean
}

interface BayesianResult {
  trials: TrialResult[]
  best_trial: {
    trial_number: number
    params: Record<string, number>
    compliance_rate: number
    delta_rate: number
  } | null
  original_compliance_rate: number
  n_trials: number
  n_feasible: number
  study_duration_sec: number
}

interface BayesianOptimizationPanelProps {
  apiUrl: string
  sessionId: string | null
  causeResult: CauseResult | null
  measurementPoints: { x: number; y: number; z: number }[]
  config: {
    latitude: number
    longitude: number
    timezone: number
    date: { month: number; day: number }
  }
}

function extractBlockers(causeResult: CauseResult): { building_id: string; height: number }[] {
  if (!causeResult) return []
  const blockers = causeResult.blocker_buildings || causeResult.blockers || []
  return blockers.map((b: { building_id?: string; id?: string; height?: number }) => ({
    building_id: b.building_id || b.id || 'unknown',
    height: b.height || 0,
  }))
}

export default function BayesianOptimizationPanel({
  apiUrl,
  sessionId,
  causeResult,
  measurementPoints,
  config,
}: BayesianOptimizationPanelProps) {
  const blockers = extractBlockers(causeResult)

  // Variable configs per building
  const [variables, setVariables] = useState<VariableConfig[]>(() =>
    blockers.map(b => ({
      building_id: b.building_id,
      original_height: b.height,
      height_range: [Math.max(1, b.height - 20), b.height + 20] as [number, number],
      translate_range: null,
      rotation_enabled: false,
    }))
  )

  // Optimization settings
  const [nTrials, setNTrials] = useState(50)
  const [showConstraints, setShowConstraints] = useState(false)
  const [maxCoverageRatio, setMaxCoverageRatio] = useState<string>('')
  const [maxFar, setMaxFar] = useState<string>('')
  const [siteArea, setSiteArea] = useState<string>('')

  // Execution state
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<BayesianResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const optimPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (optimPollRef.current) clearInterval(optimPollRef.current)
    }
  }, [])

  const canRun = !!causeResult && !!sessionId && measurementPoints.length > 0 && variables.length > 0

  const estimatedMinutes = Math.max(1, Math.round(nTrials * 0.12))

  const updateVariable = (idx: number, patch: Partial<VariableConfig>) => {
    setVariables(prev => prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)))
  }

  const handleRun = useCallback(async () => {
    if (!canRun) return
    setIsRunning(true)
    setProgress(0)
    setResult(null)
    setError(null)

    try {
      const constraints =
        maxCoverageRatio || maxFar
          ? {
              max_coverage_ratio: maxCoverageRatio ? Number(maxCoverageRatio) : null,
              max_far: maxFar ? Number(maxFar) : null,
              site_area: siteArea ? Number(siteArea) : null,
            }
          : null

      const res = await fetch(`${apiUrl}/optimizer/auto-optimize`, {
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
          measurement_points: measurementPoints.map(p => ({ x: p.x, y: p.y, z: p.z })),
          variables: variables.map(v => ({
            building_id: v.building_id,
            height_range: v.height_range,
            translate_range: v.translate_range,
            rotation_enabled: v.rotation_enabled,
          })),
          n_trials: nTrials,
          constraints,
        }),
      })
      if (!res.ok) throw new Error('최적화 요청 실패')
      const data = await res.json()
      const optimId = data.optimize_id || data.sweep_id

      // Poll for status
      if (optimPollRef.current) clearInterval(optimPollRef.current)
      optimPollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`${apiUrl}/optimizer/${optimId}/status`)
          const status = await statusRes.json()
          setProgress(status.progress || 0)

          if (status.status === 'completed') {
            clearInterval(optimPollRef.current!)
            optimPollRef.current = null
            const resultRes = await fetch(`${apiUrl}/optimizer/${optimId}/result`)
            const optimResult: BayesianResult = await resultRes.json()
            setResult(optimResult)
            setIsRunning(false)
          } else if (status.status === 'error') {
            clearInterval(optimPollRef.current!)
            optimPollRef.current = null
            setError(status.message || '최적화 중 오류가 발생하였습니다.')
            setIsRunning(false)
          }
        } catch {
          clearInterval(optimPollRef.current!)
          optimPollRef.current = null
          setError('상태 조회 중 오류가 발생하였습니다.')
          setIsRunning(false)
        }
      }, 3000)
    } catch {
      setError('최적화 요청에 실패하였습니다.')
      setIsRunning(false)
    }
  }, [apiUrl, sessionId, causeResult, measurementPoints, config, variables, nTrials, maxCoverageRatio, maxFar, siteArea, canRun])

  // For convergence chart: sample every Nth trial
  const getChartTrials = (trials: TrialResult[]) => {
    if (trials.length <= 10) return trials
    const step = trials.length <= 50 ? 5 : 10
    return trials.filter((_, i) => i % step === 0 || i === trials.length - 1)
  }

  return (
    <div className="space-y-3">
      {/* Variable configuration per blocker building */}
      {variables.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] text-gray-500 font-medium">변수 설정</div>
          {variables.map((v, idx) => (
            <div key={v.building_id} className="border border-gray-100 rounded-md p-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  {v.building_id}
                  <span className="text-gray-400 ml-1">({v.original_height}m)</span>
                </span>
              </div>

              {/* Height range */}
              <div className="flex items-center gap-1.5">
                <label className="flex items-center gap-1 text-[10px] text-gray-500 min-w-[52px]">
                  <input
                    type="checkbox"
                    checked={v.height_range !== null}
                    onChange={e =>
                      updateVariable(idx, {
                        height_range: e.target.checked
                          ? [Math.max(1, v.original_height - 20), v.original_height + 20]
                          : null,
                      })
                    }
                    className="w-3 h-3"
                  />
                  높이(m)
                </label>
                {v.height_range && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={v.height_range[0]}
                      onChange={e =>
                        updateVariable(idx, {
                          height_range: [Number(e.target.value), v.height_range![1]],
                        })
                      }
                      className="w-14 text-[10px] border rounded px-1 py-0.5"
                      min={1}
                    />
                    <span className="text-[10px] text-gray-400">~</span>
                    <input
                      type="number"
                      value={v.height_range[1]}
                      onChange={e =>
                        updateVariable(idx, {
                          height_range: [v.height_range![0], Number(e.target.value)],
                        })
                      }
                      className="w-14 text-[10px] border rounded px-1 py-0.5"
                      min={1}
                    />
                  </div>
                )}
              </div>

              {/* Translate range */}
              <div className="flex items-center gap-1.5">
                <label className="flex items-center gap-1 text-[10px] text-gray-500 min-w-[52px]">
                  <input
                    type="checkbox"
                    checked={v.translate_range !== null}
                    onChange={e =>
                      updateVariable(idx, {
                        translate_range: e.target.checked ? 10 : null,
                      })
                    }
                    className="w-3 h-3"
                  />
                  이동(m)
                </label>
                {v.translate_range !== null && (
                  <input
                    type="number"
                    value={v.translate_range}
                    onChange={e =>
                      updateVariable(idx, { translate_range: Number(e.target.value) })
                    }
                    className="w-14 text-[10px] border rounded px-1 py-0.5"
                    min={1}
                    max={100}
                  />
                )}
              </div>

              {/* Rotation */}
              <div className="flex items-center gap-1.5">
                <label className="flex items-center gap-1 text-[10px] text-gray-500 min-w-[52px]">
                  <input
                    type="checkbox"
                    checked={v.rotation_enabled}
                    onChange={e =>
                      updateVariable(idx, { rotation_enabled: e.target.checked })
                    }
                    className="w-3 h-3"
                  />
                  회전
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {variables.length === 0 && (
        <p className="text-[10px] text-gray-400">원인 분석 결과에서 차폐 건물을 찾을 수 없습니다.</p>
      )}

      {/* Optimization settings */}
      <div>
        <div className="text-[10px] text-gray-500 font-medium mb-1">최적화 설정</div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-gray-500">시행 횟수</label>
          <input
            type="number"
            value={nTrials}
            onChange={e => setNTrials(Math.min(500, Math.max(10, Number(e.target.value))))}
            className="w-16 text-xs border rounded px-1.5 py-1"
            min={10}
            max={500}
          />
        </div>
      </div>

      {/* Constraints (collapsible) */}
      <div className="border border-gray-100 rounded-md overflow-hidden">
        <button
          onClick={() => setShowConstraints(!showConstraints)}
          className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-1">
            <Settings size={10} />
            <span>제약 조건 (선택)</span>
          </div>
          {showConstraints ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
        {showConstraints && (
          <div className="px-2 pb-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-gray-500 min-w-[64px]">건폐율 상한(%)</label>
              <input
                type="number"
                value={maxCoverageRatio}
                onChange={e => setMaxCoverageRatio(e.target.value)}
                placeholder="예: 60"
                className="w-20 text-[10px] border rounded px-1 py-0.5"
                min={0}
                max={100}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-gray-500 min-w-[64px]">용적률 상한(%)</label>
              <input
                type="number"
                value={maxFar}
                onChange={e => setMaxFar(e.target.value)}
                placeholder="예: 300"
                className="w-20 text-[10px] border rounded px-1 py-0.5"
                min={0}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-gray-500 min-w-[64px]">대지면적(m2)</label>
              <input
                type="number"
                value={siteArea}
                onChange={e => setSiteArea(e.target.value)}
                placeholder="예: 500"
                className="w-20 text-[10px] border rounded px-1 py-0.5"
                min={0}
              />
            </div>
            <p className="text-[9px] text-gray-400">건폐율/용적률 사용 시 대지면적 입력 필요</p>
          </div>
        )}
      </div>

      {/* Run button */}
      <div>
        <button
          onClick={handleRun}
          disabled={!canRun || isRunning}
          className="w-full py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5
            bg-amber-500 text-white hover:bg-amber-600
            disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isRunning ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              최적화 진행 중... {progress.toFixed(0)}%
            </>
          ) : (
            <>
              <Play size={12} />
              자동 최적화 실행
            </>
          )}
        </button>
        {isRunning && (
          <div className="mt-1.5">
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[9px] text-gray-400 mt-0.5 text-center">
              약 {estimatedMinutes}분 소요 예상
            </p>
          </div>
        )}
        {!canRun && !isRunning && (
          <p className="text-[10px] text-gray-400 mt-1">원인 분석 완료 후 사용 가능</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-2">
          <p className="text-[10px] text-red-600">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-2">
          {/* Best trial highlight */}
          {result.best_trial && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
              <div className="flex items-center gap-1 mb-1">
                <Trophy size={10} className="text-amber-600" />
                <span className="text-[10px] text-amber-600 font-medium">
                  최적 시행 #{result.best_trial.trial_number}
                </span>
              </div>
              <div className="text-xs">
                적합률{' '}
                <span className="text-gray-400">{result.original_compliance_rate}%</span>
                {' → '}
                <span className="font-semibold text-green-600">
                  {result.best_trial.compliance_rate}%
                </span>
                <span className="text-green-500 ml-1">
                  (+{result.best_trial.delta_rate}%)
                </span>
              </div>
              <div className="mt-1 space-y-0.5">
                {Object.entries(result.best_trial.params).map(([key, val]) => (
                  <div key={key} className="text-[10px] text-gray-600">
                    <span className="text-gray-400">{key}:</span> {typeof val === 'number' ? val.toFixed(1) : val}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Study stats */}
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <div className="flex items-center gap-0.5">
              <Clock size={9} />
              {result.study_duration_sec < 60
                ? `${result.study_duration_sec.toFixed(0)}초`
                : `${(result.study_duration_sec / 60).toFixed(1)}분`}
            </div>
            <div>{result.n_trials}회 시행</div>
            <div>{result.n_feasible}회 적합</div>
          </div>

          {/* Convergence mini-chart */}
          {result.trials.length > 0 && (
            <div>
              <div className="text-[10px] text-gray-500 font-medium mb-1">수렴 추이</div>
              <div className="space-y-px">
                {getChartTrials(result.trials).map(t => {
                  const maxRate = Math.max(
                    ...result.trials.map(tr => tr.compliance_rate),
                    result.original_compliance_rate,
                    1
                  )
                  const widthPct = Math.max(2, (t.compliance_rate / maxRate) * 100)
                  const improved = t.delta_rate > 0
                  return (
                    <div key={t.trial_number} className="flex items-center gap-1">
                      <span className="text-[8px] text-gray-400 w-5 text-right shrink-0">
                        #{t.trial_number}
                      </span>
                      <div className="flex-1 h-3 bg-gray-50 rounded-sm overflow-hidden">
                        <div
                          className={`h-full rounded-sm transition-all ${
                            improved ? 'bg-green-400' : 'bg-red-300'
                          }`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-gray-500 w-10 text-right shrink-0">
                        {t.compliance_rate}%
                      </span>
                    </div>
                  )
                })}
              </div>
              {/* Original baseline marker */}
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[8px] text-gray-400 w-5 text-right">기준</span>
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-[8px] text-gray-400 w-10 text-right">
                  {result.original_compliance_rate}%
                </span>
              </div>
            </div>
          )}

          {/* Full trial history table */}
          <div>
            <div className="text-[10px] text-gray-500 font-medium mb-1">전체 시행 결과</div>
            <div className="max-h-[200px] overflow-y-auto border border-gray-100 rounded-md">
              <table className="w-full text-[10px]">
                <thead className="text-gray-400 sticky top-0 bg-white">
                  <tr>
                    <th className="text-left py-0.5 px-1">#</th>
                    <th className="text-right py-0.5 px-1">적합률</th>
                    <th className="text-right py-0.5 px-1">변화</th>
                    <th className="text-center py-0.5 px-1">제약</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  {result.trials.map(t => (
                    <tr
                      key={t.trial_number}
                      className={
                        result.best_trial && t.trial_number === result.best_trial.trial_number
                          ? 'bg-amber-50'
                          : t.delta_rate > 0
                          ? 'bg-green-50/50'
                          : ''
                      }
                    >
                      <td className="py-0.5 px-1">{t.trial_number}</td>
                      <td className="text-right py-0.5 px-1">{t.compliance_rate}%</td>
                      <td
                        className={`text-right py-0.5 px-1 ${
                          t.delta_rate > 0
                            ? 'text-green-600'
                            : t.delta_rate < 0
                            ? 'text-red-500'
                            : 'text-gray-400'
                        }`}
                      >
                        {t.delta_rate > 0 ? '+' : ''}
                        {t.delta_rate}%
                      </td>
                      <td className="text-center py-0.5 px-1">
                        {t.feasible ? (
                          <span className="text-green-500">O</span>
                        ) : (
                          <span className="text-red-400">X</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
