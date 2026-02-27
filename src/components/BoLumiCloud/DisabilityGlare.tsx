'use client'

import { motion } from 'framer-motion'
import type { GlareResult } from '@/lib/types/glare'

interface DisabilityGlareProps {
  results: GlareResult[]
}

export default function DisabilityGlare({ results }: DisabilityGlareProps) {
  if (results.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl font-light text-gray-900 mb-6">
            불능현휘 판정
          </h2>
          <div className="w-24 h-px bg-gray-300 mb-6" />

          <div className="border border-gray-200 p-12 text-center">
            <p className="text-base text-gray-800">
              먼저 분석 탭에서 현휘 분석을 실행하세요.
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // 불능현휘 5가지 조건
  const disabilityResults = results.filter(r => r.disability === 1)
  const totalFiles = results.length
  const disabilityCount = disabilityResults.length
  const disabilityRate = (disabilityCount / totalFiles) * 100

  // 조건별 위반 건수 계산
  const violations = {
    contrast: results.filter(r => r.contrast >= 10).length,
    maxLuminance: results.filter(r => r.max > 25000).length,
    avgLuminance: results.filter(r => r.average > 10000).length,
    dgp: results.filter(r => r.dgp > 0.45).length,
    dgi: results.filter(r => r.dgi > 31).length,
  }

  const conditions = [
    {
      id: 'contrast',
      title: '휘도 대비 (Contrast Ratio)',
      criterion: '≥ 10',
      value: violations.contrast,
      description: '최대 휘도와 평균 휘도의 비율이 10 이상일 때 불능현휘 발생 가능',
      status: violations.contrast > 0 ? 'violation' : 'pass'
    },
    {
      id: 'maxLuminance',
      title: '최대 휘도 (Maximum Luminance)',
      criterion: '> 25,000 cd/m²',
      value: violations.maxLuminance,
      description: '극단적으로 밝은 광원이 있을 때 (태양 직사광 등)',
      status: violations.maxLuminance > 0 ? 'violation' : 'pass'
    },
    {
      id: 'avgLuminance',
      title: '평균 휘도 (Average Luminance)',
      criterion: '> 10,000 cd/m²',
      value: violations.avgLuminance,
      description: '전체적으로 과도하게 밝은 환경',
      status: violations.avgLuminance > 0 ? 'violation' : 'pass'
    },
    {
      id: 'dgp',
      title: 'DGP (Daylight Glare Probability)',
      criterion: '> 0.45',
      value: violations.dgp,
      description: '45% 이상 현휘 감지 확률 (견딜 수 없음)',
      status: violations.dgp > 0 ? 'violation' : 'pass'
    },
    {
      id: 'dgi',
      title: 'DGI (Daylight Glare Index)',
      criterion: '> 31',
      value: violations.dgi,
      description: 'Hopkinson 지수 31 초과 (견딜 수 없음)',
      status: violations.dgi > 0 ? 'violation' : 'pass'
    }
  ]

  return (
    <div className="max-w-6xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-light text-gray-900 mb-6">
          불능현휘 판정
        </h2>
        <div className="w-24 h-px bg-gray-300 mb-6" />

        {/* 전체 요약 */}
        <div className="border border-gray-200 p-8 mb-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-light text-gray-900 mb-2">
                {totalFiles}
              </div>
              <div className="text-sm text-gray-800">분석 파일 수</div>
            </div>

            <div className="text-center">
              <div className={`text-4xl font-light mb-2 ${
                disabilityCount > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {disabilityCount}
              </div>
              <div className="text-sm text-gray-800">불능현휘 판정</div>
            </div>

            <div className="text-center">
              <div className={`text-4xl font-light mb-2 ${
                disabilityRate > 10 ? 'text-red-600' : 'text-green-600'
              }`}>
                {disabilityRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-800">위반율</div>
            </div>
          </div>
        </div>

        {/* 5가지 조건 상세 */}
        <div className="space-y-4">
          {conditions.map((condition) => (
            <div
              key={condition.id}
              className={`border p-6 ${
                condition.status === 'violation'
                  ? 'border-red-600 bg-red-50'
                  : 'border-green-600 bg-green-50'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {condition.title}
                  </h3>
                  <p className="text-sm text-gray-800 mt-1">
                    {condition.description}
                  </p>
                </div>

                <div className="text-right">
                  <div className={`text-2xl font-light ${
                    condition.status === 'violation' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {condition.value}
                  </div>
                  <div className="text-xs text-gray-800">건 위반</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-700">기준:</span>
                <span className="font-medium text-gray-900">{condition.criterion}</span>
                <span className={`ml-auto px-3 py-1 text-xs ${
                  condition.status === 'violation'
                    ? 'bg-red-600 text-white'
                    : 'bg-green-600 text-white'
                }`}>
                  {condition.status === 'violation' ? '위반' : '적합'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 위반 파일 목록 */}
        {disabilityCount > 0 && (
          <div className="mt-8 border border-red-600 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              불능현휘 판정 파일 ({disabilityCount}개)
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {disabilityResults.map((result, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border border-gray-200 bg-white"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {result.file}
                    </div>
                    <div className="text-xs text-gray-800 mt-1">
                      DGP: {result.dgp.toFixed(3)} | DGI: {result.dgi.toFixed(1)} |
                      평균: {result.average.toFixed(0)} cd/m² | 최대: {result.max.toFixed(0)} cd/m²
                    </div>
                  </div>

                  <div className="text-xs text-red-600 font-medium">
                    {result.dgp_rating}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 개선 권고 */}
        <div className="mt-8 p-6 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">개선 권고사항</h4>

          <div className="space-y-3 text-sm text-gray-800">
            <p>
              <span className="font-medium text-gray-900">차양 설치:</span>
              블라인드, 커튼, 외부 루버 등으로 직사광선 차단
            </p>
            <p>
              <span className="font-medium text-gray-900">유리 교체:</span>
              Low-E 유리, 반사 유리로 투과율 감소
            </p>
            <p>
              <span className="font-medium text-gray-900">배치 변경:</span>
              작업 공간을 창문에서 멀리 배치
            </p>
            <p>
              <span className="font-medium text-gray-900">법규 참고:</span>
              녹색건축 인증 기준 - DGP 0.45 이하 또는 DGI 31 이하 유지
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
