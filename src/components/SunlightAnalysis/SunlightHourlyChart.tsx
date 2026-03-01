'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { PointSunlightResult } from '@/lib/types/sunlight'

// ─── SunlightHourlyChart ────────────────────

interface SunlightHourlyChartProps {
  point: PointSunlightResult
  timeStart?: string
  stepMinutes?: number
}

interface ChartData {
  time: string
  status: number
}

export default function SunlightHourlyChart({
  point,
  timeStart = '08:00',
  stepMinutes = 1,
}: SunlightHourlyChartProps) {
  const data = useMemo((): ChartData[] => {
    const [startH, startM] = timeStart.split(':').map(Number)
    const startTotalMin = startH * 60 + startM

    return point.hourly_status.map((status, idx) => {
      const totalMin = startTotalMin + idx * stepMinutes
      const h = Math.floor(totalMin / 60)
      const m = totalMin % 60
      return {
        time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        status: Math.max(status, 0), // -1(야간) -> 0 처리
      }
    })
  }, [point.hourly_status, timeStart, stepMinutes])

  const tickInterval = Math.max(1, Math.floor(data.length / 16))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">
          {point.name} — 시간별 일조 상태
        </h4>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-amber-400 rounded-sm inline-block" />
            일조
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-slate-300 rounded-sm inline-block" />
            그림자
          </span>
        </div>
      </div>

      <div className="border border-gray-200 p-4">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              interval={tickInterval}
              tickLine={false}
            />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 1]}
              tickFormatter={(v: number) => (v === 1 ? '일조' : '그림자')}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb' }}
              labelStyle={{ fontWeight: 500 }}
              formatter={(value) => [Number(value) === 1 ? '일조' : '그림자', '상태']}
            />
            <Bar dataKey="status" radius={[1, 1, 0, 0]} maxBarSize={8}>
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.status === 1 ? '#fbbf24' : '#cbd5e1'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>
          총일조: <strong className="text-gray-700">{point.total_hours.toFixed(1)}h</strong>
        </span>
        <span>
          연속일조: <strong className="text-gray-700">{point.continuous_hours.toFixed(1)}h</strong>
        </span>
        <span className={point.compliant ? 'text-green-600' : 'text-red-600'}>
          {point.compliant ? '적합' : '부적합'}
        </span>
      </div>
    </div>
  )
}
