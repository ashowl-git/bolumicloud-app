'use client'

import { createContext, useContext } from 'react'
import {
  LocalizedText,
  LocalizedArray,
  getLocalizedText,
  getLocalizedArray,
  Locale,
} from '@/lib/types/i18n'

/**
 * Locale Context - lightweight i18n without next-intl
 */
interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const LocaleContext = createContext<LocaleContextType>({
  locale: 'ko',
  setLocale: () => {},
})

/**
 * Hook to get localized text based on current locale
 */
export function useLocalizedText() {
  const { locale } = useContext(LocaleContext)

  const t = (text: LocalizedText | string): string => {
    return getLocalizedText(text, locale)
  }

  const tArray = (arr: LocalizedArray | string[]): string[] => {
    return getLocalizedArray(arr, locale)
  }

  return { t, tArray, locale }
}

export default useLocalizedText
