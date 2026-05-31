'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, ScanEye, Sun, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import type { LocalizedText } from '@/lib/types/i18n'

const STORAGE_KEY = 'bolumicloud-welcome-dismissed'

const txt = {
  greeting: { ko: 'BoLumiCloud에 오신 것을 환영합니다', en: 'Welcome to BoLumiCloud' } as LocalizedText,
  subtitle: {
    ko: '건축 빛환경 시뮬레이션 플랫폼입니다. 아래 분석 중 하나를 선택하여 시작하세요.',
    en: 'An architectural lighting simulation platform. Choose an analysis below to get started.',
  } as LocalizedText,
}

const GUIDES = [
  {
    icon: ScanEye,
    name: { ko: '현휘 분석', en: 'Glare Analysis' } as LocalizedText,
    desc: { ko: 'Radiance 기반 DGP/DGI 현휘 분석', en: 'Radiance-based DGP/DGI glare analysis' } as LocalizedText,
    href: '/analysis/glare',
    color: 'border-red-200 bg-red-50/50',
    iconColor: 'text-red-600',
  },
  {
    icon: Sun,
    name: { ko: '일조 분석', en: 'Sunlight Analysis' } as LocalizedText,
    desc: { ko: 'OBJ/SN5F 모델을 업로드하고 일조시간을 분석합니다', en: 'Upload OBJ/SN5F models and analyze sunlight hours' } as LocalizedText,
    href: '/analysis/sunlight',
    color: 'border-amber-200 bg-amber-50/50',
    iconColor: 'text-amber-600',
  },
  {
    icon: Eye,
    name: { ko: '조망 분석', en: 'View Analysis' } as LocalizedText,
    desc: { ko: '건물에서 바라보는 조망권을 평가합니다', en: 'Evaluate view rights from buildings' } as LocalizedText,
    href: '/analysis/view',
    color: 'border-blue-200 bg-blue-50/50',
    iconColor: 'text-blue-600',
  },
  {
    icon: EyeOff,
    name: { ko: '사생활 분석', en: 'Privacy Analysis' } as LocalizedText,
    desc: { ko: '인접 건물 간 사생활 침해를 분석합니다', en: 'Analyze privacy between adjacent buildings' } as LocalizedText,
    href: '/analysis/privacy',
    color: 'border-purple-200 bg-purple-50/50',
    iconColor: 'text-purple-600',
  },
]

export default function WelcomeBanner() {
  const { t } = useLocalizedText()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(STORAGE_KEY)
      if (!dismissed) setVisible(true)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  if (!visible) return null

  return (
    <div className="relative border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 mb-8 overflow-hidden">
      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 text-gray-300 hover:text-gray-500 transition-colors"
        title="닫기"
      >
        <X size={16} />
      </button>

      <h2 className="text-base font-medium text-gray-900 mb-1">{t(txt.greeting)}</h2>
      <p className="text-sm text-gray-500 mb-5 max-w-lg">{t(txt.subtitle)}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {GUIDES.map((guide) => {
          const Icon = guide.icon
          return (
            <Link
              key={guide.href}
              href={guide.href}
              className={`group border rounded-lg p-4 transition-all hover:shadow-sm hover:-translate-y-px ${guide.color}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={guide.iconColor} />
                <span className="text-sm font-medium text-gray-800">{t(guide.name)}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">{t(guide.desc)}</p>
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 group-hover:text-gray-600 transition-colors">
                시작하기 <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
