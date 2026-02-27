'use client'

import { useState } from 'react'
import { LocaleContext } from '@/hooks/useLocalizedText'
import BoLumiCloudContent from '@/components/BoLumiCloud/BoLumiCloudContent'
import type { Locale } from '@/lib/types/i18n'

export default function Home() {
  const [locale, setLocale] = useState<Locale>('ko')

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <BoLumiCloudContent />
    </LocaleContext.Provider>
  )
}
