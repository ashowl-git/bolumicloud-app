import { describe, it, expect } from 'vitest'
import { formatDuration, formatEta } from '../format'

describe('formatDuration', () => {
  it('returns seconds for values under 60', () => {
    expect(formatDuration(0)).toBe('0.0s')
    expect(formatDuration(30)).toBe('30.0s')
    expect(formatDuration(59.9)).toBe('59.9s')
  })

  it('returns minutes and seconds for 60+', () => {
    expect(formatDuration(60)).toBe('1m 0s')
    expect(formatDuration(90)).toBe('1m 30s')
    expect(formatDuration(3600)).toBe('60m 0s')
  })

  it('handles fractional seconds under 60', () => {
    expect(formatDuration(1.23)).toBe('1.2s')
  })
})

describe('formatEta', () => {
  it('returns seconds only when under 60', () => {
    expect(formatEta(0)).toBe('0초')
    expect(formatEta(30)).toBe('30초')
  })

  it('returns minutes and seconds for 60+', () => {
    expect(formatEta(60)).toBe('1분 0초')
    expect(formatEta(90)).toBe('1분 30초')
    expect(formatEta(3600)).toBe('60분 0초')
  })
})
