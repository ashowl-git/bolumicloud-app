import { describe, it, expect } from 'vitest'
import { DEG, waldramY, PALETTE, SUN_PATH_PALETTE } from '../projection'

describe('waldramY', () => {
  it('returns 0 for altitude 0', () => {
    expect(waldramY(0)).toBe(0)
  })

  it('returns 0.5 for altitude 45', () => {
    // sin(90 deg) = 1, 0.5 * 1 = 0.5
    expect(waldramY(45)).toBeCloseTo(0.5, 10)
  })

  it('returns 0 for altitude 90', () => {
    // sin(180 deg) = 0, 0.5 * 0 = 0
    expect(waldramY(90)).toBeCloseTo(0, 10)
  })

  it('returns correct value for 30 degrees', () => {
    // 0.5 * sin(60 deg) = 0.5 * sqrt(3)/2 = sqrt(3)/4
    const expected = 0.5 * Math.sin(60 * DEG)
    expect(waldramY(30)).toBeCloseTo(expected, 10)
  })

  it('returns correct value for 60 degrees', () => {
    // 0.5 * sin(120 deg) = 0.5 * sin(60 deg) = sqrt(3)/4
    const expected = 0.5 * Math.sin(120 * DEG)
    expect(waldramY(60)).toBeCloseTo(expected, 10)
  })

  it('is symmetric: waldramY(30) === waldramY(60)', () => {
    // sin(2*30) = sin(60), sin(2*60) = sin(120) = sin(60)
    expect(waldramY(30)).toBeCloseTo(waldramY(60), 10)
  })

  it('handles negative altitude', () => {
    // sin(2 * -10 deg) = sin(-20 deg) which is negative
    expect(waldramY(-10)).toBeLessThan(0)
  })

  it('maximum at 45 degrees', () => {
    // waldramY should be maximized at 45 degrees
    expect(waldramY(45)).toBeGreaterThan(waldramY(30))
    expect(waldramY(45)).toBeGreaterThan(waldramY(60))
    expect(waldramY(45)).toBeGreaterThan(waldramY(10))
    expect(waldramY(45)).toBeGreaterThan(waldramY(80))
  })
})

describe('DEG constant', () => {
  it('equals pi/180', () => {
    expect(DEG).toBeCloseTo(Math.PI / 180, 15)
  })
})

describe('PALETTE', () => {
  it('has 8 colors', () => {
    expect(PALETTE).toHaveLength(8)
  })

  it('all entries are valid hex colors', () => {
    for (const color of PALETTE) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })
})

describe('SUN_PATH_PALETTE', () => {
  it('has 4 colors', () => {
    expect(SUN_PATH_PALETTE).toHaveLength(4)
  })

  it('all entries are valid hex colors', () => {
    for (const color of SUN_PATH_PALETTE) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })
})
