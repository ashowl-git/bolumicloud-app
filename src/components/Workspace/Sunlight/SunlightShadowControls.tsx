'use client'

import { useCallback, useMemo } from 'react'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import type { PlaybackState, PlaybackSpeed } from '@/lib/types/shadow'
import { minuteToTime } from '@/lib/types/shadow'

const SPEED_OPTIONS: PlaybackSpeed[] = [1, 2, 5]

interface SunlightShadowControlsProps {
  playback: PlaybackState
  maxMinute: number
  stepSize: number
  onMinuteChange: (minute: number) => void
  onPlay: () => void
  onPause: () => void
  onSpeedChange: (speed: PlaybackSpeed) => void
  visible?: boolean
  startMinuteBase?: number
}

export default function SunlightShadowControls({
  playback,
  maxMinute,
  stepSize,
  onMinuteChange,
  onPlay,
  onPause,
  onSpeedChange,
  visible = true,
  startMinuteBase = 480,
}: SunlightShadowControlsProps) {
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value)
      const snapped = Math.round(value / stepSize) * stepSize
      onMinuteChange(snapped)
    },
    [stepSize, onMinuteChange],
  )

  const currentTime = minuteToTime(playback.currentMinute, startMinuteBase)

  // Compute dynamic time labels: start, midpoint, end
  const timeLabels = useMemo(() => {
    const startTime = minuteToTime(0, startMinuteBase)
    const midMinute = Math.round(maxMinute / 2)
    const midTime = minuteToTime(midMinute, startMinuteBase)
    const endTime = minuteToTime(maxMinute, startMinuteBase)

    const labels = [
      { minute: 0, label: startTime },
      { minute: midMinute, label: midTime },
      { minute: maxMinute, label: endTime },
    ]
    return labels.map((l) => ({
      ...l,
      pct: maxMinute > 0 ? (l.minute / maxMinute) * 100 : 0,
    }))
  }, [maxMinute, startMinuteBase])

  if (!visible) return null

  return (
    <div
      className="bg-gray-900/85 backdrop-blur-md border border-white/10 shadow-xl
        px-4 py-3 rounded-xl max-w-xl w-full"
    >
      <div className="flex items-center gap-3">
        {/* Play controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onMinuteChange(0)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <SkipBack size={14} />
          </button>
          <button
            onClick={playback.isPlaying ? onPause : onPlay}
            className="p-1.5 text-white hover:text-red-400 transition-colors"
          >
            {playback.isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={() => onMinuteChange(maxMinute)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <SkipForward size={14} />
          </button>
        </div>

        {/* Current time */}
        <span className="text-xs font-semibold text-white tabular-nums min-w-[38px]">
          {currentTime}
        </span>

        {/* Slider + time labels */}
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={maxMinute}
            step={stepSize}
            value={playback.currentMinute}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-white/15 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-webkit-slider-thumb]:transition-transform"
          />
          {/* Time labels below slider */}
          <div className="relative w-full h-3 mt-0.5">
            {timeLabels.map((tl) => (
              <span
                key={tl.label}
                className="absolute text-[9px] text-gray-400 tabular-nums -translate-x-1/2"
                style={{ left: `${tl.pct}%` }}
              >
                {tl.label}
              </span>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div className="flex items-center gap-0.5">
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                playback.speed === speed
                  ? 'text-red-400 font-semibold bg-white/10'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
