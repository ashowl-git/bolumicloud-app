'use client'

import { useMemo } from 'react'
import { computeSolarPosition } from '@/components/SunlightAnalysis/hooks/useSolarPosition'

interface SunDirectionResult {
  direction: [number, number, number]
  altitude: number
  azimuth: number
  isBelowHorizon: boolean
}

/**
 * Compute Three.js directional light position from geographic + temporal params.
 *
 * Coordinate system: +X=East, +Y=Up, +Z=South (matching camera presets).
 * Returns a point at distance 100 along the solar direction ray.
 */
export function useSunDirection(
  latitude: number,
  longitude: number,
  month: number,
  day: number,
  timeMinute: number,
  timezoneOffset: number = 9,
): SunDirectionResult {
  return useMemo(() => {
    const hour = Math.floor(timeMinute / 60)
    const minute = timeMinute % 60
    const { altitude, azimuth } = computeSolarPosition(
      latitude, longitude, month, day, hour, minute, timezoneOffset,
    )

    if (altitude <= 0) {
      return {
        direction: [50, 80, -30] as [number, number, number],
        altitude,
        azimuth,
        isBelowHorizon: true,
      }
    }

    const altRad = (altitude * Math.PI) / 180
    const aziRad = (azimuth * Math.PI) / 180
    const direction: [number, number, number] = [
      Math.cos(altRad) * Math.sin(aziRad) * 100,
      Math.sin(altRad) * 100,
      -Math.cos(altRad) * Math.cos(aziRad) * 100,
    ]

    return { direction, altitude, azimuth, isBelowHorizon: false }
  }, [latitude, longitude, month, day, timeMinute, timezoneOffset])
}

/**
 * Compute approximate sunrise/sunset minutes for slider range.
 * Uses the same NOAA algorithm, scanning in 5-minute increments.
 */
export function useSunriseSunset(
  latitude: number,
  longitude: number,
  month: number,
  day: number,
  timezoneOffset: number = 9,
): { sunrise: number; sunset: number } {
  return useMemo(() => {
    let sunrise = 360 // default 06:00
    let sunset = 1080 // default 18:00

    // Scan from 04:00 (240min) to find sunrise
    for (let m = 240; m < 720; m += 5) {
      const h = Math.floor(m / 60)
      const min = m % 60
      const pos = computeSolarPosition(latitude, longitude, month, day, h, min, timezoneOffset)
      if (pos.altitude > 0) {
        sunrise = m
        break
      }
    }

    // Scan from 20:00 (1200min) backward to find sunset
    for (let m = 1200; m > 720; m -= 5) {
      const h = Math.floor(m / 60)
      const min = m % 60
      const pos = computeSolarPosition(latitude, longitude, month, day, h, min, timezoneOffset)
      if (pos.altitude > 0) {
        sunset = m
        break
      }
    }

    return { sunrise, sunset }
  }, [latitude, longitude, month, day, timezoneOffset])
}
