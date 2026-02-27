'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { GlareResult } from '@/lib/types/glare'

// Plotly 타입 정의
declare global {
  interface Window {
    Plotly?: {
      newPlot: (element: HTMLElement, data: unknown[], layout: unknown, config?: unknown) => void
    }
  }
}

interface ResultsChartProps {
  results: GlareResult[]
  chartType: 'time' | 'month' | 'viewpoint'
}

export default function ResultsChart({ results, chartType }: ResultsChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  const prepareData = useCallback(() => {
    if (chartType === 'time') {
      // 시간별 평균 휘도 박스플롯
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
      // 월별 평균 휘도 박스플롯
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
      // 뷰포인트별 DGP 비교
      const viewpoints = Array.from(new Set(results.map(r => r.viewp).filter(Boolean))).sort()

      return [{
        type: 'bar',
        x: viewpoints,
        y: viewpoints.map(vp =>
          results.filter(r => r.viewp === vp)
            .reduce((sum, r) => sum + r.dgp, 0) /
          results.filter(r => r.viewp === vp).length
        ),
        marker: {
          color: '#dc2626',
          line: {
            color: '#991b1b',
            width: 1
          }
        }
      }]
    }

    return []
  }, [results, chartType])

  const getLayout = useCallback(() => {
    const titles = {
      time: '시간대별 평균 휘도 분포',
      month: '월별 평균 휘도 분포',
      viewpoint: '뷰포인트별 평균 DGP'
    }

    const yaxis_titles = {
      time: '평균 휘도 (cd/m²)',
      month: '평균 휘도 (cd/m²)',
      viewpoint: 'DGP (Daylight Glare Probability)'
    }

    return {
      title: {
        text: titles[chartType],
        font: { size: 18, family: 'Inter, sans-serif' }
      },
      xaxis: {
        title: chartType === 'time' ? '시간' : chartType === 'month' ? '월' : '뷰포인트',
        gridcolor: '#f1f5f9'
      },
      yaxis: {
        title: yaxis_titles[chartType],
        gridcolor: '#f1f5f9'
      },
      plot_bgcolor: '#ffffff',
      paper_bgcolor: '#ffffff',
      height: 400,
      margin: { t: 50, b: 50, l: 60, r: 30 }
    }
  }, [chartType])

  const renderChart = useCallback(() => {
    if (!chartRef.current || !window.Plotly) return

    const Plotly = window.Plotly

    const data = prepareData()
    const layout = getLayout()

    Plotly.newPlot(chartRef.current, data, layout, {
      responsive: true,
      displayModeBar: true,
      displaylogo: false
    })
  }, [prepareData, getLayout])

  const loadPlotly = useCallback(async () => {
    // Plotly CDN 동적 로드
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
    // Plotly를 동적으로 로드 (CDN 방식)
    if (typeof window !== 'undefined' && chartRef.current) {
      loadPlotly()
    }
  }, [loadPlotly])

  return (
    <div className="border border-gray-200 p-6">
      <div ref={chartRef} className="w-full" />

      {results.length === 0 && (
        <div className="text-center text-gray-800 py-12">
          분석 결과가 없습니다
        </div>
      )}
    </div>
  )
}
