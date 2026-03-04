import { describe, it, expect } from 'vitest'
import {
  defaultDates,
  DATE_COLORS,
  dateLabel,
  ALTITUDE_CIRCLES,
  AZIMUTH_DIRECTIONS,
} from '../defaults'

describe('defaultDates', () => {
  it('returns 4 dates', () => {
    expect(defaultDates()).toHaveLength(4)
  })

  it('returns dates in current year', () => {
    const year = new Date().getFullYear()
    for (const d of defaultDates()) {
      expect(d.getFullYear()).toBe(year)
    }
  })

  it('returns equinoxes and solstices in correct months', () => {
    const dates = defaultDates()
    expect(dates[0].getMonth()).toBe(2) // March
    expect(dates[1].getMonth()).toBe(5) // June
    expect(dates[2].getMonth()).toBe(8) // September
    expect(dates[3].getMonth()).toBe(11) // December
  })
})

describe('DATE_COLORS', () => {
  it('has 4 colors', () => {
    expect(DATE_COLORS).toHaveLength(4)
  })
})

describe('dateLabel', () => {
  it('returns Equinox (Mar) for March date', () => {
    expect(dateLabel(new Date(2024, 2, 20))).toBe('Equinox (Mar)')
  })

  it('returns Solstice (Jun) for June date', () => {
    expect(dateLabel(new Date(2024, 5, 21))).toBe('Solstice (Jun)')
  })

  it('returns Equinox (Sep) for September date', () => {
    expect(dateLabel(new Date(2024, 8, 23))).toBe('Equinox (Sep)')
  })

  it('returns Solstice (Dec) for December date', () => {
    expect(dateLabel(new Date(2024, 11, 21))).toBe('Solstice (Dec)')
  })

  it('returns M/D for other months', () => {
    expect(dateLabel(new Date(2024, 6, 15))).toBe('7/15')
  })
})

describe('ALTITUDE_CIRCLES', () => {
  it('has 8 entries from 10 to 80', () => {
    expect(ALTITUDE_CIRCLES).toEqual([10, 20, 30, 40, 50, 60, 70, 80])
  })
})

describe('AZIMUTH_DIRECTIONS', () => {
  it('has 8 cardinal/ordinal directions', () => {
    expect(AZIMUTH_DIRECTIONS).toHaveLength(8)
  })

  it('starts with North at 0 degrees', () => {
    expect(AZIMUTH_DIRECTIONS[0]).toEqual({ deg: 0, label: 'N' })
  })

  it('includes South at 180 degrees', () => {
    const south = AZIMUTH_DIRECTIONS.find((d) => d.label === 'S')
    expect(south?.deg).toBe(180)
  })
})
