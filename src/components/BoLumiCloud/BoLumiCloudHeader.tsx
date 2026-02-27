'use client'

import { motion } from 'framer-motion'
import type { BackendStatus, BackendInfo } from './hooks/useBackendHealth'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { LocalizedText } from '@/lib/types/i18n'

const headerText = {
  description: {
    ko: 'Radiance의 모든 기능을 웹 브라우저에서. pyradiance 110개 함수로 구현한 건축 조명 분석 통합 대시보드.',
    en: 'All Radiance features in your web browser. Integrated architectural lighting analysis dashboard built with 110 pyradiance functions.'
  } as LocalizedText,
  features: {
    ko: '5대 카테고리, 11가지 기능: 현휘/일조 분석, 이미지 처리, 파일 변환, 하늘 모델 생성, 3D 렌더링, 재질 분석, 법규 준수.',
    en: '5 categories, 11 features: Glare/daylight analysis, image processing, file conversion, sky model generation, 3D rendering, material analysis, code compliance.'
  } as LocalizedText,
  phaseNote: {
    ko: 'Phase 1 완료: 현휘 분석 | Phase 2-5 순차 개발 중 (pyradiance 마스터플랜 참조)',
    en: 'Phase 1 Complete: Glare Analysis | Phase 2-5 in sequential development (see pyradiance masterplan)'
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
    <section className="py-24 px-8 bg-amber-50/50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-extralight mb-4 text-gray-900 tracking-tighter">
            B<span className="text-red-600">o</span>LumiCloud: Lighting Analysis Dashboard
          </h1>
          <div className="w-24 h-px bg-gray-300 mb-6" />
          <p className="text-base text-gray-800 font-normal max-w-3xl leading-[1.8]">
            {t(headerText.description)}
            <br />
            {t(headerText.features)}
            <br />
            <span className="text-gray-700 text-sm">
              {t(headerText.phaseNote)}
            </span>
          </p>
        </motion.div>

        {/* Backend status indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-8"
        >
          <div className={`
            border p-4 flex items-center gap-4 text-sm
            ${backendStatus === 'healthy' ? 'border-green-200 bg-green-50' : ''}
            ${backendStatus === 'unhealthy' ? 'border-red-200 bg-red-50' : ''}
            ${backendStatus === 'checking' ? 'border-gray-200 bg-amber-50/50' : ''}
          `}>
            <div className="flex items-center gap-2">
              {backendStatus === 'checking' && (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                  <span className="text-gray-700 font-medium">{t(headerText.backendChecking)}</span>
                </>
              )}
              {backendStatus === 'healthy' && (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-green-800 font-medium">{t(headerText.backendHealthy)}</span>
                </>
              )}
              {backendStatus === 'unhealthy' && (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-red-800 font-medium">{t(headerText.backendUnhealthy)}</span>
                </>
              )}
            </div>

            {backendStatus === 'healthy' && backendInfo && (
              <div className="flex items-center gap-4 text-xs text-gray-800 ml-auto">
                <span>pyradiance {backendInfo.pyradiance_version}</span>
                <span className="text-gray-400">|</span>
                <span>{backendInfo.cpu_count} CPU cores</span>
                <span className="text-gray-400">|</span>
                <span className="text-green-600">{backendInfo.status}</span>
              </div>
            )}

            {backendStatus === 'unhealthy' && (
              <div className="text-xs text-red-600 ml-auto">
                {t(headerText.backendStartHint)}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
