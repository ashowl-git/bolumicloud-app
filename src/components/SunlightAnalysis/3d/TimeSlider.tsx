'use client'

import { useCallback, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import type { PlaybackState, PlaybackSpeed } from '@/lib/types/shadow'
import { minuteToTime } from '@/lib/types/shadow'

// ─── 재생 속도 옵션 ─────────────────────────────

const SPEED_OPTIONS: PlaybackSpeed[] = [1, 2, 5]

// ─── TimeSlider ─────────────────────────────

interface TimeSliderProps {
  playback: PlaybackState
  maxMinute: number
  stepSize: number
  onMinuteChange: (minute: number) => void
  onPlay: () => void
  onPause: () => void
  onSpeedChange: (speed: PlaybackSpeed) => void
}

export default function TimeSlider({
  playback,
  maxMinute,
  stepSize,
  onMinuteChange,
  onPlay,
  onPause,
  onSpeedChange,
}: TimeSliderProps) {
  // 키보드 단축키
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          onMinuteChange(Math.max(0, playback.currentMinute - (e.shiftKey ? stepSize * 10 : stepSize)))
          break
        case 'ArrowRight':
          e.preventDefault()
          onMinuteChange(Math.min(maxMinute, playback.currentMinute + (e.shiftKey ? stepSize * 10 : stepSize)))
          break
        case ' ':
          e.preventDefault()
          if (playback.isPlaying) { onPause() } else { onPlay() }
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [playback, maxMinute, stepSize, onMinuteChange, onPlay, onPause])

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value)
      const snapped = Math.round(value / stepSize) * stepSize
      onMinuteChange(snapped)
    },
    [stepSize, onMinuteChange],
  )

  const skipBack = useCallback(() => {
    onMinuteChange(0)
  }, [onMinuteChange])

  const skipForward = useCallback(() => {
    onMinuteChange(maxMinute)
  }, [maxMinute, onMinuteChange])

  const currentTime = minuteToTime(playback.currentMinute)

  return (
    <div className="border border-gray-200 bg-white px-4 py-3 space-y-3">
      {/* 컨트롤 바 */}
      <div className="flex items-center gap-3">
        {/* 재생 컨트롤 */}
        <div className="flex items-center gap-1">
          <button
            onClick={skipBack}
            className="p-1.5 text-gray-500 hover:text-gray-800 transition-colors"
            title="처음으로"
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={playback.isPlaying ? onPause : onPlay}
            className="p-1.5 text-gray-700 hover:text-red-600 transition-colors"
            title={playback.isPlaying ? '일시정지' : '재생'}
          >
            {playback.isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={skipForward}
            className="p-1.5 text-gray-500 hover:text-gray-800 transition-colors"
            title="끝으로"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* 현재 시간 */}
        <span className="text-sm font-medium text-gray-800 tabular-nums min-w-[45px]">
          {currentTime}
        </span>

        {/* 슬라이더 */}
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={maxMinute}
            step={stepSize}
            value={playback.currentMinute}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:shadow-sm"
          />
        </div>

        {/* 속도 선택 */}
        <div className="flex items-center gap-0.5">
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              onClick={() => onSpeedChange(speed)}
              className={`px-2 py-1 text-xs transition-colors ${
                playback.speed === speed
                  ? 'text-red-600 font-medium'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* 시간 범위 라벨 */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>08:00</span>
        <span>10:00</span>
        <span>12:00</span>
        <span>14:00</span>
        <span>16:00</span>
      </div>
    </div>
  )
}
