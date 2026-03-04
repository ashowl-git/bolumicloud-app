import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'
import { useLocalizedText, LocaleContext } from '../useLocalizedText'

function createWrapper(locale: 'ko' | 'en') {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      LocaleContext.Provider,
      { value: { locale, setLocale: () => {} } },
      children
    )
  Wrapper.displayName = 'LocaleWrapper'
  return Wrapper
}

describe('useLocalizedText', () => {
  // ── t() with LocalizedText object ──

  it('returns Korean text when locale is ko', () => {
    const { result } = renderHook(() => useLocalizedText(), {
      wrapper: createWrapper('ko'),
    })

    expect(result.current.t({ ko: '안녕', en: 'hello' })).toBe('안녕')
  })

  it('returns English text when locale is en', () => {
    const { result } = renderHook(() => useLocalizedText(), {
      wrapper: createWrapper('en'),
    })

    expect(result.current.t({ ko: '안녕', en: 'hello' })).toBe('hello')
  })

  // ── t() with plain string ──

  it('returns plain string as-is regardless of locale', () => {
    const { result } = renderHook(() => useLocalizedText(), {
      wrapper: createWrapper('en'),
    })

    expect(result.current.t('static text')).toBe('static text')
  })

  // ── tArray() with LocalizedArray object ──

  it('returns Korean array when locale is ko', () => {
    const { result } = renderHook(() => useLocalizedText(), {
      wrapper: createWrapper('ko'),
    })

    const arr = { ko: ['하나', '둘'], en: ['one', 'two'] }
    expect(result.current.tArray(arr)).toEqual(['하나', '둘'])
  })

  it('returns English array when locale is en', () => {
    const { result } = renderHook(() => useLocalizedText(), {
      wrapper: createWrapper('en'),
    })

    const arr = { ko: ['하나', '둘'], en: ['one', 'two'] }
    expect(result.current.tArray(arr)).toEqual(['one', 'two'])
  })

  // ── tArray() with plain string array ──

  it('returns plain string array as-is', () => {
    const { result } = renderHook(() => useLocalizedText(), {
      wrapper: createWrapper('ko'),
    })

    expect(result.current.tArray(['a', 'b'])).toEqual(['a', 'b'])
  })

  // ── locale value ──

  it('exposes the current locale', () => {
    const { result } = renderHook(() => useLocalizedText(), {
      wrapper: createWrapper('en'),
    })

    expect(result.current.locale).toBe('en')
  })

  // ── default locale ──

  it('defaults to ko when no provider', () => {
    const { result } = renderHook(() => useLocalizedText())

    expect(result.current.locale).toBe('ko')
    expect(result.current.t({ ko: '한국어', en: 'English' })).toBe('한국어')
  })
})
