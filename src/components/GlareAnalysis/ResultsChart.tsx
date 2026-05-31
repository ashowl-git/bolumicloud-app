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
    // Refined palette: muted, elegant tones
    const palette = ['#64748b', '#94a3b8', '#475569', '#6b7280', '#78716c']
    const accentPalette = ['#475569', '#6366f1', '#0891b2', '#7c3aed', '#d97706']

    if (chartType === 'time') {
      const times = Array.from(new Set(results.map(r => r.time).filter(Boolean))).sort()
      return times.map((time, i) => ({
        type: 'box',
        y: results.filter(r => r.time === time).map(r => r.average),
        name: `${time}시`,
        boxmean: 'sd',
        marker: { color: palette[i % palette.length], outliercolor: '#94a3b8' },
        line: { color: palette[i % palette.length], width: 1.5 },
        fillcolor: `${palette[i % palette.length]}18`,
      }))
    }

    if (chartType === 'month') {
      const months = Array.from(new Set(results.map(r => r.month).filter(Boolean)))
      return months.map((month, i) => ({
        type: 'box',
        y: results.filter(r => r.month === month).map(r => r.average),
        name: month,
        boxmean: 'sd',
        marker: { color: palette[i % palette.length], outliercolor: '#94a3b8' },
        line: { color: palette[i % palette.length], width: 1.5 },
        fillcolor: `${palette[i % palette.length]}18`,
      }))
    }

    if (chartType === 'viewpoint') {
      const viewpoints = Array.from(new Set(results.map(r => r.viewp).filter(Boolean))).sort()
      const avgDgps = viewpoints.map(vp => {
        const vpResults = results.filter(r => r.viewp === vp)
        return vpResults.reduce((sum, r) => sum + Number(r.dgp), 0) / vpResults.length
      })
      return [{
        type: 'bar',
        x: viewpoints,
        y: avgDgps,
        marker: {
          color: avgDgps.map(v =>
            v >= 0.45 ? '#dc262640' : v >= 0.40 ? '#f9731640' : v >= 0.35 ? '#eab30840' : '#64748b20'
          ),
          line: {
            color: avgDgps.map(v =>
              v >= 0.45 ? '#dc2626' : v >= 0.40 ? '#f97316' : v >= 0.35 ? '#eab308' : '#64748b'
            ),
            width: 1.5,
          },
        },
      }]
    }

    if (chartType === 'heatmap') {
      const filtered = heatmapDate === 'all'
        ? results
        : results.filter(r => r.date_label === heatmapDate)

      const viewpoints = Array.from(new Set(filtered.map(r => r.viewp).filter(Boolean))).sort()
      const times = Array.from(new Set(filtered.map(r => r.time).filter(Boolean))).sort()

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
          [0, '#f8fafc'],
          [0.2, '#bfdbfe'],
          [0.35, '#fde68a'],
          [0.45, '#fed7aa'],
          [0.6, '#fca5a5'],
          [1, '#dc2626'],
        ],
        zmin: 0,
        zmax: 0.6,
        colorbar: {
          title: { text: 'DGP', font: { size: 11, color: '#64748b' } },
          tickfont: { size: 10, color: '#94a3b8' },
          outlinewidth: 0,
          thickness: 12,
        },
        hoverongaps: false,
        xgap: 2,
        ygap: 2,
      }]
    }

    if (chartType === 'date_comparison') {
      const viewpoints = Array.from(new Set(results.map(r => r.viewp).filter(Boolean))).sort()

      return dateLabels.map((dl, i) => ({
        type: 'bar',
        name: dl,
        x: viewpoints,
        y: viewpoints.map(vp => {
          const matched = results.filter(r => r.viewp === vp && r.date_label === dl)
          if (matched.length === 0) return 0
          return matched.reduce((sum, r) => sum + Number(r.dgp), 0) / matched.length
        }),
        marker: {
          color: `${accentPalette[i % accentPalette.length]}30`,
          line: { color: accentPalette[i % accentPalette.length], width: 1.5 },
        },
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
            color: '#64748b30',
            line: { color: '#475569', width: 1 },
          },
          name: 'DGP',
        },
      ]
    }

    return []
  }, [results, chartType, heatmapDate, dateLabels])

  const getLayout = useCallback(() => {
    const titleFont = { size: 13, family: 'Inter, system-ui, sans-serif', color: '#334155' }
    const axisFont = { size: 11, family: 'Inter, system-ui, sans-serif', color: '#64748b' }
    const tickFont = { size: 10, color: '#94a3b8' }

    const titles: Record<string, string> = {
      time: '시간대별 평균 휘도 분포',
      month: '월별 평균 휘도 분포',
      viewpoint: '뷰포인트별 평균 DGP',
      heatmap: `뷰포인트 x 시간 DGP 히트맵${heatmapDate !== 'all' ? ` (${heatmapDate})` : ''}`,
      date_comparison: '날짜별 DGP 비교',
      dgp_distribution: 'DGP 분포',
    }

    const base = {
      title: { text: titles[chartType], font: titleFont, x: 0.02, xanchor: 'left' as const },
      plot_bgcolor: '#ffffff',
      paper_bgcolor: '#ffffff',
      height: 380,
      margin: { t: 48, b: 52, l: 64, r: 24 },
      font: { family: 'Inter, system-ui, sans-serif' },
    }

    const gridStyle = { gridcolor: '#f1f5f9', gridwidth: 1, zeroline: false, tickfont: tickFont }

    if (chartType === 'heatmap') {
      return {
        ...base,
        xaxis: { ...gridStyle, title: { text: '시간', font: axisFont } },
        yaxis: { ...gridStyle, title: { text: '뷰포인트', font: axisFont } },
      }
    }

    if (chartType === 'date_comparison') {
      return {
        ...base,
        barmode: 'group',
        bargap: 0.2,
        bargroupgap: 0.08,
        xaxis: { ...gridStyle, title: { text: '뷰포인트', font: axisFont } },
        yaxis: { ...gridStyle, title: { text: 'DGP', font: axisFont } },
        legend: { font: { size: 11, color: '#64748b' }, bgcolor: 'transparent' },
      }
    }

    if (chartType === 'dgp_distribution') {
      return {
        ...base,
        bargap: 0.05,
        xaxis: { ...gridStyle, title: { text: 'DGP', font: axisFont } },
        yaxis: { ...gridStyle, title: { text: '빈도', font: axisFont } },
        shapes: [
          { type: 'line', x0: 0.35, x1: 0.35, y0: 0, y1: 1, yref: 'paper', line: { color: '#eab30880', width: 1, dash: 'dot' } },
          { type: 'line', x0: 0.40, x1: 0.40, y0: 0, y1: 1, yref: 'paper', line: { color: '#f9731680', width: 1, dash: 'dot' } },
          { type: 'line', x0: 0.45, x1: 0.45, y0: 0, y1: 1, yref: 'paper', line: { color: '#dc262680', width: 1, dash: 'dot' } },
        ],
        annotations: [
          { x: 0.35, y: 1.04, yref: 'paper', text: '감지', showarrow: false, font: { size: 9, color: '#ca8a04' } },
          { x: 0.40, y: 1.04, yref: 'paper', text: '방해', showarrow: false, font: { size: 9, color: '#ea580c' } },
          { x: 0.45, y: 1.04, yref: 'paper', text: '견딜수없음', showarrow: false, font: { size: 9, color: '#dc2626' } },
        ],
      }
    }

    const yaxis_titles: Record<string, string> = {
      time: '평균 휘도 (cd/m2)',
      month: '평균 휘도 (cd/m2)',
      viewpoint: 'DGP',
    }

    return {
      ...base,
      xaxis: {
        ...gridStyle,
        title: {
          text: chartType === 'time' ? '시간' : chartType === 'month' ? '월' : '뷰포인트',
          font: axisFont,
        },
      },
      yaxis: {
        ...gridStyle,
        title: { text: yaxis_titles[chartType] || '', font: axisFont },
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
      modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
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
              heatmapDate === 'all' ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-500 hover:text-gray-700'
            }`}
          >
            전체
          </button>
          {dateLabels.map(dl => (
            <button
              key={dl}
              onClick={() => setHeatmapDate(dl)}
              className={`px-3 py-1 text-xs border transition-all ${
                heatmapDate === dl ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-500 hover:text-gray-700'
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
