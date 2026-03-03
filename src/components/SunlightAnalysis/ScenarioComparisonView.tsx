'use client'

import { useMemo } from 'react'
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { SunlightAnalysisResult } from '@/lib/types/sunlight'

interface ScenarioComparisonViewProps {
  scenarios: SunlightAnalysisResult[]
  labels?: string[]
}

export default function ScenarioComparisonView({
  scenarios,
  labels,
}: ScenarioComparisonViewProps) {
  const scenarioLabels = labels || scenarios.map((_, i) => i === 0 ? '원안' : `시나리오 ${i}`)

  const comparison = useMemo(() => {
    if (scenarios.length < 2) return null

    const base = scenarios[0]
    return scenarios.map((s, i) => {
      const deltaRate = s.summary.compliance_rate - base.summary.compliance_rate
      const deltaCompliant = s.summary.compliant_points - base.summary.compliant_points

      return {
        label: scenarioLabels[i],
        totalPoints: s.summary.total_points,
        compliantPoints: s.summary.compliant_points,
        complianceRate: s.summary.compliance_rate,
        deltaRate: i === 0 ? 0 : deltaRate,
        deltaCompliant: i === 0 ? 0 : deltaCompliant,
        isBase: i === 0,
      }
    })
  }, [scenarios, scenarioLabels])

  if (!comparison || scenarios.length < 2) {
    return (
      <div className="text-xs text-gray-400 text-center py-4">
        비교할 시나리오가 2개 이상 필요합니다
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Comparison cards */}
      <div className="grid grid-cols-1 gap-2">
        {comparison.map((sc, idx) => (
          <div
            key={idx}
            className={`border rounded-lg p-2.5 ${
              sc.isBase
                ? 'border-gray-200 bg-gray-50'
                : sc.deltaRate > 0
                  ? 'border-green-200 bg-green-50/50'
                  : sc.deltaRate < 0
                    ? 'border-red-200 bg-red-50/50'
                    : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">{sc.label}</span>
              {!sc.isBase && (
                <span className={`text-[10px] flex items-center gap-0.5 ${
                  sc.deltaRate > 0 ? 'text-green-600' : sc.deltaRate < 0 ? 'text-red-500' : 'text-gray-400'
                }`}>
                  {sc.deltaRate > 0 ? <TrendingUp size={10} /> : sc.deltaRate < 0 ? <TrendingDown size={10} /> : <Minus size={10} />}
                  {sc.deltaRate > 0 ? '+' : ''}{sc.deltaRate.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div>
                <div className="text-lg font-semibold text-gray-900">{sc.complianceRate.toFixed(1)}%</div>
                <div className="text-[10px] text-gray-400">적합률</div>
              </div>
              <div className="text-[10px] text-gray-500">
                {sc.compliantPoints}/{sc.totalPoints} 적합
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delta summary */}
      {comparison.length >= 2 && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <span>{comparison[0].label}</span>
          <ArrowRight size={12} />
          <span>{comparison[comparison.length - 1].label}</span>
          <span className={`font-medium ${
            comparison[comparison.length - 1].deltaRate > 0 ? 'text-green-600' : 'text-red-500'
          }`}>
            {comparison[comparison.length - 1].deltaRate > 0 ? '+' : ''}
            {comparison[comparison.length - 1].deltaRate.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  )
}
