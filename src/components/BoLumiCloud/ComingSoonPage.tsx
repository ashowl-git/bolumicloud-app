'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { getModuleByPath } from '@/lib/navigationConfig'

export default function ComingSoonPage() {
  const pathname = usePathname()
  const { t } = useLocalizedText()
  const result = getModuleByPath(pathname)

  const moduleName = result ? t(result.module.name) : t({ ko: '모듈', en: 'Module' })
  const moduleDesc = result ? t(result.module.description) : ''
  const Icon = result?.module.icon || Clock

  return (
    <div className="py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto text-center"
      >
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-gray-50 rounded-full">
            <Icon size={40} strokeWidth={1} className="text-gray-300" />
          </div>
        </div>

        <h2 className="text-xl font-light text-gray-900 mb-2">{moduleName}</h2>

        {moduleDesc && (
          <p className="text-sm text-gray-500 mb-6">{moduleDesc}</p>
        )}

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-sm text-gray-500">
          <Clock size={14} />
          {t({ ko: '준비 중입니다', en: 'Coming soon' })}
        </div>
      </motion.div>
    </div>
  )
}
