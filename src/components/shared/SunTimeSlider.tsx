'use client'

import { useCallback, useMemo } from 'react'
import { Sun, Play, Pause } from 'lucide-react'
import type { PlaybackSpeed } from '@/lib/types/shadow'

// Day-of-year ↔ month/day conversion
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const MONTH_START_DOY = DAYS_IN_MONTH.reduce<number[]>((acc, d, i) => {
  acc.push(i === 0 ? 1 : acc[i - 1] + DAYS_IN_MONTH[i - 1])
  return acc
}, [])

function monthDayToDoy(month: number, day: number): number {
  return MONTH_START_DOY[month - 1] + day - 1
}

function doyToMonthDay(doy: number): { month: number; day: number } {
  let d = Math.max(1, Math.min(365, doy))
  for (let m = 0; m < 12; m++) {
    if (d <= DAYS_IN_MONTH[m]) return { month: m + 1, day: d }
    d -= DAYS_IN_MONTH[m]
  }
  return { month: 12, day: 31 }
}

function minuteToTime(minute: number): string {
  const h = Math.floor(minute / 60)
  const m = minute % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const SPEED_CYCLE: PlaybackSpeed[] = [1, 2, 5]

interface SunTimeSliderProps {
  timeMinute: number
  month: number
  day?: number
  sunrise: number
  sunset: number
  altitude: number
  onTimeChange: (minute: number) => void
  onMonthChange: (month: number, day: number) => void
  // Shadow playback (optional — shown only when shadow frames exist)
  shadowPlayback?: {
    isPlaying: boolean
    speed: PlaybackSpeed
    frameMinutes: number[]  // absolute minutes (startMinuteBase + frame.minute)
  }
  onPlay?: () => void
  onPause?: () => void
  onSpeedChange?: (speed: PlaybackSpeed) => void
  showAccumulation?: boolean
  onToggleAccumulation?: () => void
}

export default function SunTimeSlider({
  timeMinute,
  month,
  day = 15,
  sunrise,
  sunset,
  altitude,
  onTimeChange,
  onMonthChange,
  shadowPlayback,
  onPlay,
  onPause,
  onSpeedChange,
  showAccumulation,
  onToggleAccumulation,
}: SunTimeSliderProps) {
  const currentDoy = useMemo(() => monthDayToDoy(month, day), [month, day])
  const hasShadow = !!shadowPlayback

  const handleTimeSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    if (shadowPlayback && shadowPlayback.frameMinutes.length > 0) {
      // Snap to nearest frame
      let closest = shadowPlayback.frameMinutes[0]
      let minDiff = Math.abs(value - closest)
      for (const fm of shadowPlayback.frameMinutes) {
        const diff = Math.abs(value - fm)
        if (diff < minDiff) {
          minDiff = diff
          closest = fm
        }
      }
      onTimeChange(closest)
    } else {
      onTimeChange(value)
    }
  }, [onTimeChange, shadowPlayback])

  const handleDateSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const doy = Number(e.target.value)
    const { month: m, day: d } = doyToMonthDay(doy)
    onMonthChange(m, d)
  }, [onMonthChange])

  const handleSpeedCycle = useCallback(() => {
    if (!shadowPlayback || !onSpeedChange) return
    const idx = SPEED_CYCLE.indexOf(shadowPlayback.speed)
    const next = SPEED_CYCLE[(idx + 1) % SPEED_CYCLE.length]
    onSpeedChange(next)
  }, [shadowPlayback, onSpeedChange])

  const timeLabels = useMemo(() => {
    const range = sunset - sunrise
    if (range <= 0) return []
    const labels = []
    for (const m of [sunrise, Math.round((sunrise + sunset) / 2), sunset]) {
      const pct = ((m - sunrise) / range) * 100
      labels.push({ minute: m, label: minuteToTime(m), pct })
    }
    return labels
  }, [sunrise, sunset])

  // Month tick positions on 1-365 scale
  const monthTicks = useMemo(() =>
    MONTH_START_DOY.map((doy, i) => ({
      label: String(i + 1),
      pct: ((doy - 1) / 364) * 100,
    })),
  [])

  const dateDisplay = `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`
  const altitudeColor = altitude <= 0 ? 'text-gray-500' : altitude < 20 ? 'text-orange-400' : 'text-amber-300'

  // Thumb color: red when shadow frames active, amber otherwise
  const thumbColor = hasShadow
    ? '[&::-webkit-slider-thumb]:bg-red-500'
    : '[&::-webkit-slider-thumb]:bg-amber-400'

  return (
    <div
      className="bg-gray-900/85 backdrop-blur-md border border-white/10 shadow-xl
        px-4 py-3 rounded-xl max-w-xl w-full"
    >
      {/* Time slider row */}
      <div className="flex items-center gap-3">
        {/* Play/Pause button (shadow mode only) */}
        {hasShadow && (
          <button
            onClick={shadowPlayback.isPlaying ? onPause : onPlay}
            className="p-1.5 text-white hover:text-red-400 transition-colors"
          >
            {shadowPlayback.isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
        )}

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
            className={`w-full h-1.5 bg-white/15 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:rounded-full ${thumbColor}
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-webkit-slider-thumb]:transition-transform`}
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

        {/* Speed cycle button (shadow mode only) */}
        {hasShadow && (
          <button
            onClick={handleSpeedCycle}
            className="px-1.5 py-0.5 text-[10px] text-red-400 font-semibold bg-white/10 rounded transition-colors hover:bg-white/20"
          >
            {shadowPlayback.speed}x
          </button>
        )}

        {/* Accumulation toggle (shadow mode only, when callback provided) */}
        {hasShadow && onToggleAccumulation && (
          <button
            onClick={onToggleAccumulation}
            className={`px-2 py-0.5 text-[10px] rounded-full transition-colors ${
              showAccumulation
                ? 'bg-blue-500 text-white font-semibold'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            영역도
          </button>
        )}
      </div>

      {/* Date slider row (day-of-year) */}
      <div className="flex items-center gap-3 mt-1">
        <span className="text-[10px] font-medium text-white tabular-nums min-w-[38px]">
          {dateDisplay}
        </span>
        <div className="flex-1">
          <input
            type="range"
            min={1}
            max={365}
            step={1}
            value={currentDoy}
            onChange={handleDateSlider}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/80
              [&::-webkit-slider-thumb]:shadow-sm"
          />
          <div className="relative w-full h-3 mt-0.5">
            {monthTicks.map((tick) => (
              <span
                key={tick.label}
                className="absolute text-[8px] text-gray-500 -translate-x-1/2"
                style={{ left: `${tick.pct}%` }}
              >
                {tick.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
