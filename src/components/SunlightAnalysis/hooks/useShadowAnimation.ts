'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useApiClient } from '@/lib/api'
import type { ShadowFrame, PlaybackState, PlaybackSpeed } from '@/lib/types/shadow'
import { logger } from '@/lib/logger'

interface UseShadowAnimationOptions {
  apiUrl: string
}

export interface UseShadowAnimationReturn {
  // 상태
  shadowId: string | null
  frames: ShadowFrame[]
  currentFrame: ShadowFrame | null
  playback: PlaybackState
  isComputing: boolean
  computeProgress: number
  error: string | null

  // 액션
  computeShadows: (params: ShadowComputeParams) => Promise<void>
  setCurrentMinute: (minute: number) => void
  play: () => void
  pause: () => void
  setSpeed: (speed: PlaybackSpeed) => void
  reset: () => void
}

interface ShadowComputeParams {
  sessionId: string
  latitude: number
  longitude: number
  month: number
  day: number
  timezoneOffset?: number
  stepMinutes?: number
}

export function useShadowAnimation({ apiUrl: _apiUrl }: UseShadowAnimationOptions): UseShadowAnimationReturn {
  const api = useApiClient()
  const [shadowId, setShadowId] = useState<string | null>(null)
  const [frames, setFrames] = useState<ShadowFrame[]>([])
  const [playback, setPlayback] = useState<PlaybackState>({
    currentMinute: 0,
    isPlaying: false,
    speed: 1,
  })
  const [isComputing, setIsComputing] = useState(false)
  const [computeProgress, setComputeProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // 현재 프레임 계산
  const currentFrame = frames.find((f) => f.minute === playback.currentMinute) ?? null

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  // ─── 그림자 계산 요청 ─────────────────────────

  const computeShadows = useCallback(async (params: ShadowComputeParams) => {
    setIsComputing(true)
    setComputeProgress(0)
    setError(null)

    try {
      const data = await api.post('/shadows/compute', {
        session_id: params.sessionId,
        latitude: params.latitude,
        longitude: params.longitude,
        timezone_offset: params.timezoneOffset ?? 9.0,
        month: params.month,
        day: params.day,
        step_minutes: params.stepMinutes ?? 10,
      })
      const sid = data.shadow_id
      setShadowId(sid)

      // 폴링으로 완료 대기
      await new Promise<void>((resolve, reject) => {
        pollRef.current = setInterval(async () => {
          try {
            const status = await api.get(`/shadows/${sid}/status`)

            setComputeProgress(status.progress)

            if (status.status === 'completed') {
              if (pollRef.current) clearInterval(pollRef.current)

              // 전체 프레임 로드
              const framesData = await api.get(`/shadows/${sid}/frames`)
              setFrames(framesData.frames)
              setIsComputing(false)
              resolve()
            } else if (status.status === 'error') {
              if (pollRef.current) clearInterval(pollRef.current)
              throw new Error(status.error || '그림자 계산 오류')
            }
          } catch (e) {
            if (pollRef.current) clearInterval(pollRef.current)
            reject(e)
          }
        }, 1000)
      })

      logger.info('Shadow computation completed', { shadowId: sid })
    } catch (err) {
      const msg = err instanceof Error ? err.message : '그림자 계산 오류'
      setError(msg)
      setIsComputing(false)
      logger.error('Shadow computation error', err instanceof Error ? err : undefined)
    }
  }, [api])

  // ─── 재생 제어 ─────────────────────────────

  const play = useCallback(() => {
    setPlayback((prev) => ({ ...prev, isPlaying: true }))
    lastTimeRef.current = performance.now()

    const animate = (now: number) => {
      const delta = now - lastTimeRef.current
      lastTimeRef.current = now

      setPlayback((prev) => {
        if (!prev.isPlaying) return prev

        // speed = minutes per second
        const minuteIncrement = (prev.speed * delta) / 1000
        const newMinute = prev.currentMinute + minuteIncrement

        // 최대 분 (step 단위로 snap)
        const maxMinute = frames.length > 0
          ? frames[frames.length - 1].minute
          : 479

        if (newMinute >= maxMinute) {
          return { ...prev, currentMinute: maxMinute, isPlaying: false }
        }

        // step 단위로 snap
        const stepSize = frames.length > 1 ? frames[1].minute - frames[0].minute : 10
        const snapped = Math.round(newMinute / stepSize) * stepSize

        return { ...prev, currentMinute: snapped }
      })

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
  }, [frames])

  const pause = useCallback(() => {
    setPlayback((prev) => ({ ...prev, isPlaying: false }))
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  // isPlaying false 시 RAF 정리
  useEffect(() => {
    if (!playback.isPlaying && rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [playback.isPlaying])

  const setCurrentMinute = useCallback((minute: number) => {
    setPlayback((prev) => ({ ...prev, currentMinute: minute }))
  }, [])

  const setSpeed = useCallback((speed: PlaybackSpeed) => {
    setPlayback((prev) => ({ ...prev, speed }))
  }, [])

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (pollRef.current) clearInterval(pollRef.current)
    setShadowId(null)
    setFrames([])
    setPlayback({ currentMinute: 0, isPlaying: false, speed: 1 })
    setIsComputing(false)
    setComputeProgress(0)
    setError(null)
  }, [])

  return {
    shadowId,
    frames,
    currentFrame,
    playback,
    isComputing,
    computeProgress,
    error,
    computeShadows,
    setCurrentMinute,
    play,
    pause,
    setSpeed,
    reset,
  }
}
