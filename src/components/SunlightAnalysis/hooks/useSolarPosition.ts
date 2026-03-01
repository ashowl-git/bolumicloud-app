'use client'

import { useMemo } from 'react'
import type { SolarPosition } from '@/lib/types/shadow'

// ─── NOAA 간이 태양 위치 (클라이언트) ──────────────
// 정밀 계산은 백엔드(NREL SPA)가 담당.
// 이 함수는 프리뷰/조명 방향에만 사용한다.

function dayOfYear(month: number, day: number): number {
  const date = new Date(2024, month - 1, day)
  const start = new Date(2024, 0, 1)
  return Math.floor((date.getTime() - start.getTime()) / 86400000) + 1
}

export function computeSolarPosition(
  latitude: number,
  longitude: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezoneOffset: number = 9,
): SolarPosition {
  const doy = dayOfYear(month, day)
  const B = ((2 * Math.PI) / 365) * (doy - 81)

  // Spencer EoT (분)
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)

  // 표준 자오선 보정
  const standardMeridian = timezoneOffset * 15
  const longitudeCorrection = (longitude - standardMeridian) * 4 // 분

  // 진태양시
  const lstMinutes = hour * 60 + minute
  const tstMinutes = lstMinutes + EoT + longitudeCorrection
  const hourAngle = (tstMinutes / 60 - 12) * 15 // 도

  // 적위
  const declination = 23.45 * Math.sin(B)

  // 라디안 변환
  const latRad = (latitude * Math.PI) / 180
  const decRad = (declination * Math.PI) / 180
  const haRad = (hourAngle * Math.PI) / 180

  // 고도
  const sinAlt =
    Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad)
  const altitude = (Math.asin(sinAlt) * 180) / Math.PI

  // 방위
  const cosAz =
    (Math.sin(decRad) - Math.sin(latRad) * sinAlt) /
    (Math.cos(latRad) * Math.cos((altitude * Math.PI) / 180))
  let azimuth = (Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180) / Math.PI
  if (hourAngle > 0) azimuth = 360 - azimuth

  return { altitude, azimuth }
}

// ─── Hook ─────────────────────────────

export function useSolarPosition(
  latitude: number,
  longitude: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezoneOffset: number = 9,
): SolarPosition {
  return useMemo(
    () => computeSolarPosition(latitude, longitude, month, day, hour, minute, timezoneOffset),
    [latitude, longitude, month, day, hour, minute, timezoneOffset],
  )
}
