'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { GlareResult } from '@/lib/types/glare'

declare global {
  interface Window {
    Plotly?: {
      newPlot: (element: HTMLElement, data: unknown[], layout: unknown, config?: unknown) => void
    }
  }
}

interface ResultsChartProps {
  results: GlareResult[]
  chartType: 'time' | 'month' | 'viewpoint' | 'heatmap' | 'date_comparison' | 'dgp_distribution'
}

export default function ResultsChart({ results, chartType }: ResultsChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [heatmapDate, setHeatmapDate] = useState<string>('all')

  // Get unique date labels for heatmap tab
  const dateLabels = Array.from(new Set(results.map(r => r.date_label).filter((v): v is string => !!v))).sort()

  const prepareData = useCallback(() => {
    if (chartType === 'time') {
      const times = Array.from(new Set(results.map(r => r.time).filter(Boolean))).sort()
      return times.map(time => ({
        type: 'box',
        y: results.filter(r => r.time === time).map(r => r.average),
        name: `${time}시`,
        boxmean: 'sd',
        marker: { color: '#dc2626' }
      }))
    }

    if (chartType === 'month') {
      const months = Array.from(new Set(results.map(r => r.month).filter(Boolean)))
      return months.map(month => ({
        type: 'box',
        y: results.filter(r => r.month === month).map(r => r.average),
        name: month,
        boxmean: 'sd',
        marker: { color: '#dc2626' }
      }))
    }

    if (chartType === 'viewpoint') {
      const viewpoints = Array.from(new Set(results.map(r => r.viewp).filter(Boolean))).sort()
      return [{
        type: 'bar',
        x: viewpoints,
        y: viewpoints.map(vp => {
          const vpResults = results.filter(r => r.viewp === vp)
          return vpResults.reduce((sum, r) => sum + Number(r.dgp), 0) / vpResults.length
        }),
        marker: {
          color: '#dc2626',
          line: { color: '#991b1b', width: 1 }
        }
      }]
    }

    if (chartType === 'heatmap') {
      // Filter by selected date
      const filtered = heatmapDate === 'all'
        ? results
        : results.filter(r => r.date_label === heatmapDate)

      const viewpoints = Array.from(new Set(filtered.map(r => r.viewp).filter(Boolean))).sort()
      const times = Array.from(new Set(filtered.map(r => r.time).filter(Boolean))).sort()

      // Build z matrix: viewpoints (rows) x times (cols)
      const z = viewpoints.map(vp =>
        times.map(t => {
          const match = filtered.find(r => r.viewp === vp && r.time === t)
          return match ? Number(match.dgp) : null
        })
      )

      return [{
        type: 'heatmap',
        x: times.map(t => `${t}시`),
        y: viewpoints,
        z,
        colorscale: [
          [0, '#22c55e'],
          [0.35, '#eab308'],
          [0.45, '#f97316'],
          [1, '#ef4444'],
        ],
        zmin: 0,
        zmax: 0.6,
        colorbar: { title: 'DGP' },
        hoverongaps: false,
      }]
    }

    if (chartType === 'date_comparison') {
      const viewpoints = Array.from(new Set(results.map(r => r.viewp).filter(Boolean))).sort()
      const colors = ['#dc2626', '#2563eb', '#16a34a', '#9333ea', '#ca8a04']

      return dateLabels.map((dl, i) => ({
        type: 'bar',
        name: dl,
        x: viewpoints,
        y: viewpoints.map(vp => {
          const matched = results.filter(r => r.viewp === vp && r.date_label === dl)
          if (matched.length === 0) return 0
          return matched.reduce((sum, r) => sum + Number(r.dgp), 0) / matched.length
        }),
        marker: { color: colors[i % colors.length] },
      }))
    }

    if (chartType === 'dgp_distribution') {
      const dgpValues = results.map(r => Number(r.dgp))
      return [
        {
          type: 'histogram',
          x: dgpValues,
          xbins: { start: 0, end: 0.7, size: 0.02 },
          marker: {
            color: dgpValues.map(v =>
              v >= 0.45 ? '#ef4444' : v >= 0.40 ? '#f97316' : v >= 0.35 ? '#eab308' : '#22c55e'
            ),
          },
          name: 'DGP 분포',
        },
      ]
    }

    return []
  }, [results, chartType, heatmapDate, dateLabels])

  const getLayout = useCallback(() => {
    const titles: Record<string, string> = {
      time: '시간대별 평균 휘도 분포',
      month: '월별 평균 휘도 분포',
      viewpoint: '뷰포인트별 평균 DGP',
      heatmap: `뷰포인트 x 시간 DGP 히트맵${heatmapDate !== 'all' ? ` (${heatmapDate})` : ''}`,
      date_comparison: '날짜별 DGP 비교',
      dgp_distribution: 'DGP 분포',
    }

    const base = {
      title: {
        text: titles[chartType],
        font: { size: 16, family: 'Inter, sans-serif' }
      },
      plot_bgcolor: '#ffffff',
      paper_bgcolor: '#ffffff',
      height: 400,
      margin: { t: 50, b: 50, l: 80, r: 30 },
    }

    if (chartType === 'heatmap') {
      return {
        ...base,
        xaxis: { title: '시간', gridcolor: '#f1f5f9' },
        yaxis: { title: '뷰포인트', gridcolor: '#f1f5f9' },
      }
    }

    if (chartType === 'date_comparison') {
      return {
        ...base,
        barmode: 'group',
        xaxis: { title: '뷰포인트', gridcolor: '#f1f5f9' },
        yaxis: { title: 'DGP', gridcolor: '#f1f5f9' },
      }
    }

    if (chartType === 'dgp_distribution') {
      return {
        ...base,
        xaxis: { title: 'DGP', gridcolor: '#f1f5f9' },
        yaxis: { title: '빈도', gridcolor: '#f1f5f9' },
        shapes: [
          { type: 'line', x0: 0.35, x1: 0.35, y0: 0, y1: 1, yref: 'paper', line: { color: '#eab308', width: 2, dash: 'dash' } },
          { type: 'line', x0: 0.40, x1: 0.40, y0: 0, y1: 1, yref: 'paper', line: { color: '#f97316', width: 2, dash: 'dash' } },
          { type: 'line', x0: 0.45, x1: 0.45, y0: 0, y1: 1, yref: 'paper', line: { color: '#ef4444', width: 2, dash: 'dash' } },
        ],
        annotations: [
          { x: 0.35, y: 1.05, yref: 'paper', text: '감지', showarrow: false, font: { size: 10, color: '#eab308' } },
          { x: 0.40, y: 1.05, yref: 'paper', text: '방해', showarrow: false, font: { size: 10, color: '#f97316' } },
          { x: 0.45, y: 1.05, yref: 'paper', text: '견딜수없음', showarrow: false, font: { size: 10, color: '#ef4444' } },
        ],
      }
    }

    const yaxis_titles: Record<string, string> = {
      time: '평균 휘도 (cd/m2)',
      month: '평균 휘도 (cd/m2)',
      viewpoint: 'DGP (Daylight Glare Probability)',
    }

    return {
      ...base,
      xaxis: {
        title: chartType === 'time' ? '시간' : chartType === 'month' ? '월' : '뷰포인트',
        gridcolor: '#f1f5f9'
      },
      yaxis: {
        title: yaxis_titles[chartType] || '',
        gridcolor: '#f1f5f9'
      },
    }
  }, [chartType, heatmapDate])

  const renderChart = useCallback(() => {
    if (!chartRef.current || !window.Plotly) return
    const data = prepareData()
    const layout = getLayout()
    window.Plotly.newPlot(chartRef.current, data, layout, {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
    })
  }, [prepareData, getLayout])

  const loadPlotly = useCallback(async () => {
    if (!window.Plotly) {
      const script = document.createElement('script')
      script.src = 'https://cdn.plot.ly/plotly-2.27.0.min.js'
      script.onload = () => renderChart()
      document.head.appendChild(script)
    } else {
      renderChart()
    }
  }, [renderChart])

  useEffect(() => {
    if (typeof window !== 'undefined' && chartRef.current) {
      loadPlotly()
    }
  }, [loadPlotly])

  return (
    <div className="border border-gray-200 p-6">
      {/* Heatmap date selector */}
      {chartType === 'heatmap' && dateLabels.length > 1 && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setHeatmapDate('all')}
            className={`px-3 py-1 text-xs border transition-all ${
              heatmapDate === 'all' ? 'border-red-600 text-red-600' : 'border-gray-200 text-gray-700'
            }`}
          >
            전체
          </button>
          {dateLabels.map(dl => (
            <button
              key={dl}
              onClick={() => setHeatmapDate(dl)}
              className={`px-3 py-1 text-xs border transition-all ${
                heatmapDate === dl ? 'border-red-600 text-red-600' : 'border-gray-200 text-gray-700'
              }`}
            >
              {dl}
            </button>
          ))}
        </div>
      )}

      <div ref={chartRef} className="w-full" />

      {results.length === 0 && (
        <div className="text-center text-gray-800 py-12">
          분석 결과가 없습니다
        </div>
      )}
    </div>
  )
}
