'use client'

import { useCallback, useMemo } from 'react'
import { Sun } from 'lucide-react'

const MONTH_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const MID_DAYS = [15, 15, 15, 15, 15, 21, 15, 15, 15, 15, 15, 21]

function minuteToTime(minute: number): string {
  const h = Math.floor(minute / 60)
  const m = minute % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

interface SunTimeSliderProps {
  timeMinute: number
  month: number
  sunrise: number
  sunset: number
  altitude: number
  onTimeChange: (minute: number) => void
  onMonthChange: (month: number, day: number) => void
}

export default function SunTimeSlider({
  timeMinute,
  month,
  sunrise,
  sunset,
  altitude,
  onTimeChange,
  onMonthChange,
}: SunTimeSliderProps) {
  const handleTimeSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onTimeChange(Number(e.target.value))
  }, [onTimeChange])

  const handleMonthSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const m = Number(e.target.value)
    onMonthChange(m, MID_DAYS[m - 1])
  }, [onMonthChange])

  const timeLabels = useMemo(() => {
    const range = sunset - sunrise
    if (range <= 0) return []
    const labels = []
    // Show labels at sunrise, midday, sunset
    for (const m of [sunrise, Math.round((sunrise + sunset) / 2), sunset]) {
      const pct = ((m - sunrise) / range) * 100
      labels.push({ minute: m, label: minuteToTime(m), pct })
    }
    return labels
  }, [sunrise, sunset])

  const altitudeColor = altitude <= 0 ? 'text-gray-500' : altitude < 20 ? 'text-orange-400' : 'text-amber-300'

  return (
    <div
      className="bg-gray-900/85 backdrop-blur-md border border-white/10 shadow-xl
        px-4 py-3 rounded-xl max-w-xl w-full"
    >
      {/* Time slider row */}
      <div className="flex items-center gap-3">
        <Sun size={16} className={altitudeColor} />
        <span className="text-xs font-semibold text-white tabular-nums min-w-[38px]">
          {minuteToTime(timeMinute)}
        </span>

        <div className="flex-1">
          <input
            type="range"
            min={sunrise}
            max={sunset}
            step={5}
            value={Math.max(sunrise, Math.min(sunset, timeMinute))}
            onChange={handleTimeSlider}
            className="w-full h-1.5 bg-white/15 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-webkit-slider-thumb]:transition-transform"
          />
          <div className="relative w-full h-3 mt-0.5">
            {timeLabels.map((tl) => (
              <span
                key={tl.minute}
                className="absolute text-[9px] text-gray-400 tabular-nums -translate-x-1/2"
                style={{ left: `${tl.pct}%` }}
              >
                {tl.label}
              </span>
            ))}
          </div>
        </div>

        <span className="text-[10px] text-gray-400 min-w-[30px] text-right">
          {altitude > 0 ? `${altitude.toFixed(0)}` : '--'}
        </span>
      </div>

      {/* Month slider row */}
      <div className="flex items-center gap-3 mt-1">
        <span className="text-[10px] text-gray-400 min-w-[20px]">{month}월</span>
        <div className="flex-1">
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={month}
            onChange={handleMonthSlider}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/80
              [&::-webkit-slider-thumb]:shadow-sm"
          />
          <div className="relative w-full h-3 mt-0.5">
            {MONTH_LABELS.map((label, i) => (
              <span
                key={i}
                className="absolute text-[8px] text-gray-500 -translate-x-1/2"
                style={{ left: `${(i / 11) * 100}%` }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
