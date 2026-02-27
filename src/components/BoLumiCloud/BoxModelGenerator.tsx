'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { logger } from '@/lib/logger'

interface BoxModelGeneratorProps {
  apiUrl: string
}

const materials = [
  { id: 'white_wall', name: '흰색 벽 (반사율 80%)', color: '#f5f5f5' },
  { id: 'gray_wall', name: '회색 벽 (반사율 50%)', color: '#808080' },
  { id: 'dark_wall', name: '어두운 벽 (반사율 20%)', color: '#333333' },
  { id: 'wood_floor', name: '나무 바닥 (반사율 40%)', color: '#d4a574' },
  { id: 'concrete', name: '콘크리트 (반사율 30%)', color: '#b0b0b0' },
]

export default function BoxModelGenerator({ apiUrl }: BoxModelGeneratorProps) {
  const [width, setWidth] = useState(5.0)  // 가로 (m)
  const [depth, setDepth] = useState(4.0)  // 세로 (m)
  const [height, setHeight] = useState(2.8)  // 높이 (m)
  const [name, setName] = useState('room')
  const [material, setMaterial] = useState('white_wall')
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const url = `${apiUrl}/generate/box?width=${width}&depth=${depth}&height=${height}&name=${name}&material=${material}`

      const response = await fetch(url, { method: 'POST' })
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `${name}_${width}x${depth}x${height}.rad`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

    } catch (error) {
      logger.error('Box generation error', error instanceof Error ? error : undefined)
    } finally {
      setGenerating(false)
    }
  }

  const volume = (width * depth * height).toFixed(2)
  const floorArea = (width * depth).toFixed(2)

  return (
    <div className="max-w-4xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-light text-gray-900 mb-6">
          3D 방 모델 생성
        </h2>
        <div className="w-24 h-px bg-gray-300 mb-6" />

        {/* 1. 크기 입력 */}
        <div className="border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-normal text-gray-900 mb-4">
            1. 방 크기 입력 (단위: m)
          </h3>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm text-gray-700 mb-2 block">
                가로 (Width)
              </label>
              <input
                type="number"
                step="0.1"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full border border-gray-200 p-3 text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 mb-2 block">
                세로 (Depth)
              </label>
              <input
                type="number"
                step="0.1"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="w-full border border-gray-200 p-3 text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 mb-2 block">
                높이 (Height)
              </label>
              <input
                type="number"
                step="0.1"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full border border-gray-200 p-3 text-sm"
              />
            </div>
          </div>

          {/* 계산된 값 */}
          <div className="flex gap-6 text-sm text-gray-800 pt-4 border-t border-gray-200">
            <div>
              <span className="text-gray-900 font-medium">바닥 면적:</span> {floorArea} m²
            </div>
            <div>
              <span className="text-gray-900 font-medium">부피:</span> {volume} m³
            </div>
          </div>
        </div>

        {/* 2. 모델 이름 */}
        <div className="border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-normal text-gray-900 mb-4">
            2. 모델 이름
          </h3>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="room"
            className="w-full border border-gray-200 p-3 text-sm"
          />

          <p className="text-xs text-gray-800 mt-2">
            Radiance 파일 내부에서 사용될 객체 이름
          </p>
        </div>

        {/* 3. 재질 선택 */}
        <div className="border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-normal text-gray-900 mb-4">
            3. 재질 선택
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {materials.map((mat) => (
              <button
                key={mat.id}
                onClick={() => setMaterial(mat.id)}
                className={`flex items-center gap-3 border-2 p-3 transition-all text-left ${
                  material === mat.id
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <div
                  className="w-8 h-8 border border-gray-300"
                  style={{ backgroundColor: mat.color }}
                />
                <div className="text-sm text-gray-900">{mat.name}</div>
              </button>
            ))}
          </div>
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
            {generating ? '생성 중...' : '3D 모델 생성 및 다운로드'}
          </button>

          <p className="text-xs text-gray-800 mt-3">
            Radiance .rad 파일 (rpict, rtrace에서 사용 가능)
          </p>
        </div>

        {/* 설명 */}
        <div className="mt-8 p-6 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">genbox 기능 설명</h4>

          <div className="space-y-3 text-sm text-gray-800">
            <p>
              <span className="font-medium text-gray-900">genbox:</span>
              Radiance의 간단한 직육면체 모델 생성 도구입니다.
              6개 면(바닥, 천장, 4개 벽)을 자동으로 생성합니다.
            </p>
            <p>
              <span className="font-medium text-gray-900">사용 용도:</span>
              일조/조명 시뮬레이션의 기본 공간 모델로 사용됩니다.
              rpict와 함께 사용하여 렌더링하거나, 일조 분석에 활용할 수 있습니다.
            </p>
            <p>
              <span className="font-medium text-gray-900">재질:</span>
              반사율에 따라 실내 조도 분포가 크게 달라집니다.
              흰색 벽(80%)은 밝고, 어두운 벽(20%)은 조도가 낮습니다.
            </p>
            <p className="text-xs text-gray-800 mt-4">
              pyradiance.genbox 기반 - Radiance 공식 도구
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
