import { describe, it, expect } from 'vitest'
import {
  DEG,
  RAD,
  dayOfYear,
  fractionalYear,
  equationOfTime,
  solarDeclination,
  sunPosition,
  stereoR,
  isPointInPolygon,
} from '../solar-position'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('constants', () => {
  it('DEG equals pi/180', () => {
    expect(DEG).toBeCloseTo(Math.PI / 180, 15)
  })

  it('RAD equals 180/pi', () => {
    expect(RAD).toBeCloseTo(180 / Math.PI, 15)
  })

  it('DEG * RAD === 1', () => {
    expect(DEG * RAD).toBeCloseTo(1, 15)
  })
})

// ---------------------------------------------------------------------------
// dayOfYear
// ---------------------------------------------------------------------------

describe('dayOfYear', () => {
  it('returns 1 for January 1', () => {
    expect(dayOfYear(new Date(2024, 0, 1))).toBe(1)
  })

  it('returns 32 for February 1', () => {
    // Jan has 31 days
    expect(dayOfYear(new Date(2024, 1, 1))).toBe(32)
  })

  it('returns 60 for February 29 in leap year', () => {
    expect(dayOfYear(new Date(2024, 1, 29))).toBe(60)
  })

  it('returns 366 for December 31 in leap year', () => {
    expect(dayOfYear(new Date(2024, 11, 31))).toBe(366)
  })

  it('returns 365 for December 31 in non-leap year', () => {
    expect(dayOfYear(new Date(2023, 11, 31))).toBe(365)
  })

  it('returns 172 for June 21 in non-leap year (2023)', () => {
    // Jan(31) + Feb(28) + Mar(31) + Apr(30) + May(31) + Jun(20) = 171 + 1 = 172
    expect(dayOfYear(new Date(2023, 5, 21))).toBe(172)
  })
})

// ---------------------------------------------------------------------------
// fractionalYear
// ---------------------------------------------------------------------------

describe('fractionalYear', () => {
  it('returns a value between 0 and 2*pi', () => {
    const mid = new Date(2024, 5, 15, 12)
    const fy = fractionalYear(mid)
    expect(fy).toBeGreaterThanOrEqual(0)
    expect(fy).toBeLessThan(2 * Math.PI)
  })

  it('is near 0 at start of year', () => {
    const jan1 = new Date(2024, 0, 1, 12)
    jan1.setUTCHours(12)
    const fy = fractionalYear(jan1)
    // doy=1, hour=12 -> (2*pi*(0 + 0/24))/366 ~ 0
    expect(fy).toBeCloseTo(0, 1)
  })
})

// ---------------------------------------------------------------------------
// equationOfTime
// ---------------------------------------------------------------------------

describe('equationOfTime', () => {
  it('returns a finite number', () => {
    expect(equationOfTime(0)).toEqual(expect.any(Number))
    expect(Number.isFinite(equationOfTime(0))).toBe(true)
  })

  it('is typically within -17 to +17 minutes', () => {
    // Test at several gamma values spanning the year
    for (let g = 0; g < 2 * Math.PI; g += 0.5) {
      const eot = equationOfTime(g)
      expect(eot).toBeGreaterThan(-18)
      expect(eot).toBeLessThan(18)
    }
  })
})

// ---------------------------------------------------------------------------
// solarDeclination
// ---------------------------------------------------------------------------

describe('solarDeclination', () => {
  it('returns value in reasonable range (about -0.41 to +0.41 rad)', () => {
    for (let g = 0; g < 2 * Math.PI; g += 0.3) {
      const decl = solarDeclination(g)
      expect(decl).toBeGreaterThan(-0.45)
      expect(decl).toBeLessThan(0.45)
    }
  })
})

// ---------------------------------------------------------------------------
// sunPosition
// ---------------------------------------------------------------------------

describe('sunPosition', () => {
  const SEOUL_LAT = 37.5665
  const SEOUL_LNG = 126.978
  const KST = 9

  it('returns high altitude at summer solstice noon (Seoul)', () => {
    const juneSolstice = new Date(2024, 5, 21)
    const pos = sunPosition(SEOUL_LAT, SEOUL_LNG, juneSolstice, 12, KST)
    // Seoul summer noon altitude should be roughly 75-76 degrees
    expect(pos.altitude).toBeGreaterThan(60)
    expect(pos.altitude).toBeLessThan(85)
  })

  it('returns low altitude at winter solstice noon (Seoul)', () => {
    const decSolstice = new Date(2024, 11, 21)
    const pos = sunPosition(SEOUL_LAT, SEOUL_LNG, decSolstice, 12, KST)
    // Seoul winter noon altitude should be roughly 29 degrees
    expect(pos.altitude).toBeGreaterThan(20)
    expect(pos.altitude).toBeLessThan(40)
  })

  it('returns negative altitude before sunrise', () => {
    const date = new Date(2024, 5, 21)
    const pos = sunPosition(SEOUL_LAT, SEOUL_LNG, date, 3, KST)
    expect(pos.altitude).toBeLessThan(0)
  })

  it('azimuth is roughly south (180 deg) at solar noon in northern hemisphere', () => {
    const date = new Date(2024, 2, 20) // equinox
    const pos = sunPosition(SEOUL_LAT, SEOUL_LNG, date, 12, KST)
    // At solar noon the sun should be roughly due south
    expect(pos.azimuth).toBeGreaterThan(150)
    expect(pos.azimuth).toBeLessThan(210)
  })

  it('summer altitude > winter altitude at same hour', () => {
    const summer = new Date(2024, 5, 21)
    const winter = new Date(2024, 11, 21)
    const summerPos = sunPosition(SEOUL_LAT, SEOUL_LNG, summer, 12, KST)
    const winterPos = sunPosition(SEOUL_LAT, SEOUL_LNG, winter, 12, KST)
    expect(summerPos.altitude).toBeGreaterThan(winterPos.altitude)
  })
})

// ---------------------------------------------------------------------------
// stereoR
// ---------------------------------------------------------------------------

describe('stereoR', () => {
  it('returns 1 for altitude 0 (horizon)', () => {
    // cos(0)/(1+sin(0)) = 1/1 = 1
    expect(stereoR(0)).toBeCloseTo(1, 10)
  })

  it('returns 0 for altitude 90 (zenith)', () => {
    // cos(90)/(1+sin(90)) = 0/2 = 0
    expect(stereoR(90)).toBeCloseTo(0, 10)
  })

  it('returns value between 0 and 1 for intermediate altitudes', () => {
    for (let alt = 1; alt < 90; alt += 10) {
      const r = stereoR(alt)
      expect(r).toBeGreaterThan(0)
      expect(r).toBeLessThan(1)
    }
  })

  it('is monotonically decreasing with altitude', () => {
    let prev = stereoR(0)
    for (let alt = 10; alt <= 90; alt += 10) {
      const curr = stereoR(alt)
      expect(curr).toBeLessThan(prev)
      prev = curr
    }
  })

  it('clamps negative altitude to 0 (returns 1)', () => {
    expect(stereoR(-10)).toBeCloseTo(1, 10)
  })

  it('returns correct value for 45 degrees', () => {
    const alt45 = 45 * DEG
    const expected = Math.cos(alt45) / (1 + Math.sin(alt45))
    expect(stereoR(45)).toBeCloseTo(expected, 10)
  })
})

// ---------------------------------------------------------------------------
// isPointInPolygon
// ---------------------------------------------------------------------------

describe('isPointInPolygon', () => {
  const square = [
    { azimuth: 0, altitude: 0 },
    { azimuth: 10, altitude: 0 },
    { azimuth: 10, altitude: 10 },
    { azimuth: 0, altitude: 10 },
  ]

  it('returns true for point inside polygon', () => {
    expect(isPointInPolygon({ azimuth: 5, altitude: 5 }, square)).toBe(true)
  })

  it('returns false for point outside polygon', () => {
    expect(isPointInPolygon({ azimuth: 15, altitude: 5 }, square)).toBe(false)
  })

  it('returns false for point far outside', () => {
    expect(isPointInPolygon({ azimuth: -5, altitude: -5 }, square)).toBe(false)
  })

  it('returns false for polygon with fewer than 3 points', () => {
    expect(isPointInPolygon({ azimuth: 5, altitude: 5 }, [
      { azimuth: 0, altitude: 0 },
      { azimuth: 10, altitude: 0 },
    ])).toBe(false)
  })

  it('returns false for empty polygon', () => {
    expect(isPointInPolygon({ azimuth: 5, altitude: 5 }, [])).toBe(false)
  })

  it('works with triangle', () => {
    const triangle = [
      { azimuth: 0, altitude: 0 },
      { azimuth: 20, altitude: 0 },
      { azimuth: 10, altitude: 20 },
    ]
    // Center of triangle
    expect(isPointInPolygon({ azimuth: 10, altitude: 5 }, triangle)).toBe(true)
    // Outside
    expect(isPointInPolygon({ azimuth: 0, altitude: 20 }, triangle)).toBe(false)
  })
})
