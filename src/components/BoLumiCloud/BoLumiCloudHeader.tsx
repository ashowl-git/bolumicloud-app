'use client'

import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import BoLumiCloudMark from './BoLumiCloudMark'
import type { BackendStatus, BackendInfo } from './hooks/useBackendHealth'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { LocalizedText } from '@/lib/types/i18n'

const headerText = {
  description: {
    ko: 'Radiance 기반 건축 조명 분석 플랫폼',
    en: 'Radiance-based Architectural Lighting Analysis Platform'
  } as LocalizedText,
  phaseNote: {
    ko: 'Phase 1-2 완료 | 5개 카테고리, 11개 기능 | pyradiance 마스터플랜 기반',
    en: 'Phase 1-2 Complete | 5 Categories, 11 Features | Based on pyradiance Masterplan'
  } as LocalizedText,
  backendChecking: {
    ko: '백엔드 확인 중...',
    en: 'Checking backend...'
  } as LocalizedText,
  backendHealthy: {
    ko: '백엔드 정상',
    en: 'Backend healthy'
  } as LocalizedText,
  backendUnhealthy: {
    ko: '백엔드 연결 실패',
    en: 'Backend connection failed'
  } as LocalizedText,
  backendStartHint: {
    ko: '백엔드 서버를 시작해주세요. (uvicorn main:app --host 0.0.0.0 --port 8080)',
    en: 'Please start the backend server. (uvicorn main:app --host 0.0.0.0 --port 8080)'
  } as LocalizedText,
}

interface BoLumiCloudHeaderProps {
  backendStatus: BackendStatus
  backendInfo: BackendInfo | null
}

export default function BoLumiCloudHeader({
  backendStatus,
  backendInfo
}: BoLumiCloudHeaderProps) {
  const { t } = useLocalizedText()

  return (
    <section className="py-16 px-8 border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <BoLumiCloudMark size={48} className="text-gray-900" />
            <h1 className="text-5xl font-extralight text-gray-900 tracking-tighter">
              B<span className="text-red-600">o</span>LumiCloud
            </h1>
          </div>
          <div className="w-24 h-px bg-gray-300 mb-4" />
          <p className="text-base text-gray-800 font-normal max-w-3xl leading-[1.8]">
            {t(headerText.description)}
          </p>
          <p className="text-sm text-gray-700 mt-2">
            {t(headerText.phaseNote)}
          </p>
        </motion.div>

        {/* Backend status - inline badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-6"
        >
          <div className="flex items-center gap-3 flex-wrap">
            {/* Status badge */}
            <div className={`
              inline-flex items-center gap-2 px-3 py-1.5 text-sm border rounded-full
              ${backendStatus === 'healthy' ? 'border-green-200 bg-green-50 text-green-800' : ''}
              ${backendStatus === 'unhealthy' ? 'border-red-200 bg-red-50 text-red-800' : ''}
              ${backendStatus === 'checking' ? 'border-gray-200 bg-gray-50 text-gray-600' : ''}
            `}>
              <Activity size={14} strokeWidth={1.5} />
              {backendStatus === 'checking' && (
                <span className="font-medium">{t(headerText.backendChecking)}</span>
              )}
              {backendStatus === 'healthy' && (
                <span className="font-medium">{t(headerText.backendHealthy)}</span>
              )}
              {backendStatus === 'unhealthy' && (
                <span className="font-medium">{t(headerText.backendUnhealthy)}</span>
              )}
            </div>

            {backendStatus === 'healthy' && backendInfo && (
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span>pyradiance {backendInfo.pyradiance_version}</span>
                <span className="text-gray-300">|</span>
                <span>{backendInfo.cpu_count} CPU cores</span>
              </div>
            )}

            {backendStatus === 'unhealthy' && (
              <span className="text-xs text-red-600">
                {t(headerText.backendStartHint)}
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
