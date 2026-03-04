import { describe, it, expect } from 'vitest'
import { getLocalizedText, getLocalizedArray } from '../i18n'
import type { LocalizedText, LocalizedArray, Locale } from '../i18n'

describe('getLocalizedText', () => {
  const text: LocalizedText = { ko: '안녕하세요', en: 'Hello' }

  it('returns Korean text for locale ko', () => {
    expect(getLocalizedText(text, 'ko')).toBe('안녕하세요')
  })

  it('returns English text for locale en', () => {
    expect(getLocalizedText(text, 'en')).toBe('Hello')
  })

  it('returns plain string as-is regardless of locale', () => {
    expect(getLocalizedText('plain', 'ko')).toBe('plain')
    expect(getLocalizedText('plain', 'en')).toBe('plain')
  })

  it('falls back to ko if locale key is missing', () => {
    const partial = { ko: '한국어' } as LocalizedText
    expect(getLocalizedText(partial, 'en')).toBe('한국어')
  })
})

describe('getLocalizedArray', () => {
  const arr: LocalizedArray = {
    ko: ['하나', '둘', '셋'],
    en: ['one', 'two', 'three'],
  }

  it('returns Korean array for locale ko', () => {
    expect(getLocalizedArray(arr, 'ko')).toEqual(['하나', '둘', '셋'])
  })

  it('returns English array for locale en', () => {
    expect(getLocalizedArray(arr, 'en')).toEqual(['one', 'two', 'three'])
  })

  it('returns plain string array as-is regardless of locale', () => {
    const plain = ['a', 'b', 'c']
    expect(getLocalizedArray(plain, 'ko')).toEqual(['a', 'b', 'c'])
    expect(getLocalizedArray(plain, 'en')).toEqual(['a', 'b', 'c'])
  })

  it('falls back to ko if locale key is missing', () => {
    const partial = { ko: ['가', '나'] } as LocalizedArray
    expect(getLocalizedArray(partial, 'en')).toEqual(['가', '나'])
  })
})
