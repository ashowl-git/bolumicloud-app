/**
 * Internationalization Types
 * Lightweight i18n for standalone BoLumiCloud app (no next-intl dependency)
 */

export type Locale = 'ko' | 'en'

export interface LocalizedText {
  ko: string
  en: string
}

export interface LocalizedArray {
  ko: string[]
  en: string[]
}

export function getLocalizedText(
  text: LocalizedText | string,
  locale: Locale
): string {
  if (typeof text === 'string') {
    return text
  }
  return text[locale] || text.ko
}

export function getLocalizedArray(
  arr: LocalizedArray | string[],
  locale: Locale
): string[] {
  if (Array.isArray(arr)) {
    return arr
  }
  return arr[locale] || arr.ko
}
