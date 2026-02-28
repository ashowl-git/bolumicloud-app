'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { logger } from '@/lib/logger'
import { useApiClient } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'

interface CityPreset {
  name: string
  latitude: number
  longitude: number
  meridian: number
}

const cityPresets: CityPreset[] = [
  { name: '서울', latitude: 37.5665, longitude: 126.9780, meridian: 135 },
  { name: '부산', latitude: 35.1796, longitude: 129.0756, meridian: 135 },
  { name: '인천', latitude: 37.4563, longitude: 126.7052, meridian: 135 },
  { name: '도쿄', latitude: 35.6762, longitude: 139.6503, meridian: 135 },
  { name: '베이징', latitude: 39.9042, longitude: 116.4074, meridian: 120 },
]

export default function SkyGenerator() {
  const api = useApiClient()
  const { showToast } = useToast()
  const [month, setMonth] = useState(6)  // 6월 (하지)
  const [day, setDay] = useState(21)
  const [hour, setHour] = useState(12.0)
  const [latitude, setLatitude] = useState(37.5665)  // 서울
  const [longitude, setLongitude] = useState(126.9780)
  const [meridian, setMeridian] = useState(135)
  const [generating, setGenerating] = useState(false)

  const handleCitySelect = (city: CityPreset) => {
    setLatitude(city.latitude)
    setLongitude(city.longitude)
    setMeridian(city.meridian)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const path = `/generate/sky?month=${month}&day=${day}&hour=${hour}&latitude=${latitude}&longitude=${longitude}&meridian=${meridian}`
      const filename = `sky_${month.toString().padStart(2, '0')}_${day.toString().padStart(2, '0')}_${hour.toFixed(1)}h.rad`
      await api.downloadBlob(path, filename, 'POST')

    } catch (error) {
      logger.error('Sky generation error', error instanceof Error ? error : undefined)
      showToast({ type: 'error', message: '하늘 모델 생성에 실패하였습니다' })
    } finally {
      setGenerating(false)
    }
  }

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ]

  return (
    <div className="max-w-4xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-light text-gray-900 mb-6">
          하늘 모델 생성
        </h2>
        <div className="w-24 h-px bg-gray-300 mb-6" />

        {/* 1. 날짜 선택 */}
        <div className="border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-normal text-gray-900 mb-4">
            1. 날짜 선택
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-700 mb-2 block">월 (Month)</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full border border-gray-200 p-3 text-sm"
              >
                {monthNames.map((name, index) => (
                  <option key={index + 1} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-700 mb-2 block">일 (Day)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="w-full border border-gray-200 p-3 text-sm"
              />
            </div>
          </div>
        </div>

        {/* 2. 시간 선택 */}
        <div className="border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-normal text-gray-900 mb-4">
            2. 시간 선택 ({hour.toFixed(1)}시)
          </h3>

          <input
            type="range"
            min="0"
            max="24"
            step="0.5"
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="w-full"
          />

          <div className="flex justify-between text-xs text-gray-800 mt-2">
            <span>0시 (자정)</span>
            <span>6시 (일출)</span>
            <span>12시 (정오)</span>
            <span>18시 (일몰)</span>
            <span>24시</span>
          </div>
        </div>

        {/* 3. 위치 선택 */}
        <div className="border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-normal text-gray-900 mb-4">
            3. 위치 선택
          </h3>

          {/* 주요 도시 프리셋 */}
          <div className="mb-4">
            <label className="text-sm text-gray-700 mb-2 block">주요 도시</label>
            <div className="flex flex-wrap gap-2">
              {cityPresets.map((city) => (
                <button
                  key={city.name}
                  onClick={() => handleCitySelect(city)}
                  className="border border-gray-200 hover:border-red-600/30 px-4 py-2 text-sm
                    text-gray-900 hover:text-red-600 transition-all"
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>

          {/* 직접 입력 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-700 mb-2 block">위도 (Latitude)</label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(Number(e.target.value))}
                className="w-full border border-gray-200 p-3 text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 mb-2 block">경도 (Longitude)</label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(Number(e.target.value))}
                className="w-full border border-gray-200 p-3 text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 mb-2 block">표준 자오선</label>
              <input
                type="number"
                value={meridian}
                onChange={(e) => setMeridian(Number(e.target.value))}
                className="w-full border border-gray-200 p-3 text-sm"
              />
            </div>
          </div>

          <p className="text-xs text-gray-800 mt-3">
            한국 표준시 자오선: 135°E (일본 표준시와 동일)
          </p>
        </div>

        {/* 4. 생성 실행 */}
        <div className="text-center">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="border border-gray-200 hover:border-red-600/30 px-8 py-4 text-lg
              text-gray-900 hover:text-red-600 transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? '생성 중...' : '하늘 모델 생성 및 다운로드'}
          </button>

          <p className="text-xs text-gray-800 mt-3">
            CIE 표준 하늘 모델 (.rad 파일)
          </p>
        </div>

        {/* 설명 */}
        <div className="mt-8 p-6 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">gendaylit 기능 설명</h4>

          <div className="space-y-3 text-sm text-gray-800">
            <p>
              <span className="font-medium text-gray-900">CIE 표준 하늘:</span>
              국제조명위원회(CIE)의 표준 주광 모델을 생성합니다.
              Perez All-Weather 알고리즘 기반으로 맑음/흐림 상태를 자동 계산합니다.
            </p>
            <p>
              <span className="font-medium text-gray-900">사용 용도:</span>
              Radiance 시뮬레이션의 광원 파일(.rad)로 사용됩니다.
              rtrace, rpict 등과 함께 사용하여 실제 일조 분석을 수행할 수 있습니다.
            </p>
            <p>
              <span className="font-medium text-gray-900">파라미터:</span>
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-gray-800 ml-4">
              <li>month/day: 태양 고도각 계산</li>
              <li>hour: 시간대 (0.0~24.0, 소수점 가능)</li>
              <li>latitude/longitude: 지리적 위치</li>
              <li>meridian: 표준시 자오선 (한국 135°E)</li>
            </ul>
            <p className="text-xs text-gray-800 mt-4">
              pyradiance.gendaylit 기반 - Radiance 공식 도구
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
