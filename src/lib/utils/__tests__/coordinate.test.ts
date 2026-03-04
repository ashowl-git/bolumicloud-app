import { describe, it, expect } from 'vitest'
import { decimalToDMS, dmsToDecimal } from '../coordinate'

describe('decimalToDMS', () => {
  it('converts positive decimal degrees', () => {
    const result = decimalToDMS(37.5665)
    expect(result.degrees).toBe(37)
    expect(result.minutes).toBe(33)
    expect(result.seconds).toBeCloseTo(59.4, 0)
  })

  it('converts negative decimal degrees', () => {
    const result = decimalToDMS(-122.4194)
    expect(result.degrees).toBe(-122)
    expect(result.minutes).toBe(25)
    expect(result.seconds).toBeCloseTo(9.84, 0)
  })

  it('handles zero', () => {
    const result = decimalToDMS(0)
    expect(result.degrees).toBe(0)
    expect(result.minutes).toBe(0)
    expect(result.seconds).toBe(0)
  })

  it('handles exact integer degrees', () => {
    const result = decimalToDMS(45)
    expect(result.degrees).toBe(45)
    expect(result.minutes).toBe(0)
    expect(result.seconds).toBe(0)
  })
})

describe('dmsToDecimal', () => {
  it('converts positive DMS to decimal', () => {
    const result = dmsToDecimal(37, 33, 59.4)
    expect(result).toBeCloseTo(37.5665, 3)
  })

  it('converts negative DMS to decimal', () => {
    const result = dmsToDecimal(-122, 25, 9.84)
    expect(result).toBeCloseTo(-122.4194, 3)
  })

  it('handles zero', () => {
    expect(dmsToDecimal(0, 0, 0)).toBe(0)
  })
})

describe('bidirectional conversion', () => {
  const testValues = [37.5665, 126.978, -33.8688, 0, 90, -90, 180]

  it.each(testValues)('roundtrip for %f', (value) => {
    const dms = decimalToDMS(value)
    const back = dmsToDecimal(dms.degrees, dms.minutes, dms.seconds)
    expect(back).toBeCloseTo(value, 2)
  })
})
