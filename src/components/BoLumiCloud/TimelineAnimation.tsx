'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface TimelineAnimationProps {
  apiUrl: string
}

export default function TimelineAnimation({ apiUrl }: TimelineAnimationProps) {
  const [animationType, setAnimationType] = useState<'falsecolor' | 'preview'>('falsecolor')
  const [fps, setFps] = useState(2)
  const [generating, setGenerating] = useState(false)

  const handleGenerate = () => {
    setGenerating(true)
    const duration = 1000 / fps
    const url = `${apiUrl}/animate/timeline?animation_type=${animationType}&fps=${fps}&duration_per_frame=${duration}`
    window.open(url, '_blank')

    // 2분 후 자동 완료 (120개 파일 기준)
    setTimeout(() => setGenerating(false), 120000)
  }

  return (
    <div className="max-w-4xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-light text-gray-900 mb-6">
          시간대별 애니메이션 생성
        </h2>
        <div className="w-24 h-px bg-gray-300 mb-6" />

        {/* 안내 */}
        <div className="mb-6 p-6 border border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-900">
            <span className="font-medium">💡 참고:</span> 먼저 현휘 분석을 실행하여 120개 파일을 업로드하세요.
            업로드된 파일들을 시간 순서로 GIF 애니메이션으로 생성합니다.
          </p>
        </div>

        {/* 1. 애니메이션 유형 */}
        <div className="border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-normal text-gray-900 mb-4">
            1. 애니메이션 유형
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setAnimationType('falsecolor')}
              className={`border-2 p-6 transition-all text-left ${
                animationType === 'falsecolor'
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="text-lg font-medium text-gray-900 mb-2">
                🎨 Falsecolor 히트맵
              </div>
              <p className="text-sm text-gray-800">
                휘도 변화를 색상으로 시각화
                <br />
                클라이언트 프레젠테이션용
              </p>
            </button>

            <button
              onClick={() => setAnimationType('preview')}
              className={`border-2 p-6 transition-all text-left ${
                animationType === 'preview'
                  ? 'border-red-600 bg-red-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="text-lg font-medium text-gray-900 mb-2">
                🖼️ HDR 원본
              </div>
              <p className="text-sm text-gray-800">
                실제 이미지 변화 확인
                <br />
                기술 검토용
              </p>
            </button>
          </div>
        </div>

        {/* 2. FPS 설정 */}
        <div className="border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-normal text-gray-900 mb-4">
            2. 속도 설정
          </h3>

          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-gray-700">FPS (Frames per Second)</label>
            <span className="text-sm text-gray-800 font-medium">{fps} fps</span>
          </div>

          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            className="w-full"
          />

          <div className="flex justify-between text-xs text-gray-800 mt-1">
            <span>1 (느림)</span>
            <span>2 (권장)</span>
            <span>10 (빠름)</span>
          </div>

          <p className="text-xs text-gray-800 mt-3">
            120개 파일 기준: {(120 / fps).toFixed(1)}초 재생 시간
          </p>
        </div>

        {/* 3. 생성 */}
        <div className="text-center">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="border border-gray-200 hover:border-red-600/30 px-8 py-4 text-lg
              text-gray-900 hover:text-red-600 transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'GIF 생성 중... (약 2분 소요)' : 'GIF 애니메이션 생성 및 다운로드'}
          </button>

          {generating && (
            <p className="text-sm text-gray-800 mt-4">
              120개 프레임을 처리하고 있습니다. 잠시만 기다려주세요...
            </p>
          )}
        </div>

        {/* 설명 */}
        <div className="mt-8 p-6 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">사용 예시</h4>
          <ul className="space-y-2 text-sm text-gray-800">
            <li>• <span className="font-medium">클라이언트 프레젠테이션:</span> Falsecolor로 하루 동안의 현휘 변화 시각화</li>
            <li>• <span className="font-medium">설계 검토:</span> 시간대별 문제 영역 빠르게 파악</li>
            <li>• <span className="font-medium">보고서 첨부:</span> GIF를 PowerPoint, PDF에 삽입</li>
          </ul>
        </div>
      </motion.div>
    </div>
  )
}
