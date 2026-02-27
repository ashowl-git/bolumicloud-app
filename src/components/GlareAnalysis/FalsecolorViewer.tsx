'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

interface FalsecolorViewerProps {
  filename: string
  apiUrl: string
}

export default function FalsecolorViewer({ filename, apiUrl }: FalsecolorViewerProps) {
  const [scale, setScale] = useState(1000)

  const falsecolorUrl = `${apiUrl}/glare/falsecolor/${filename}?scale=${scale}`

  return (
    <div className="border border-gray-200 p-6">
      <h3 className="text-lg font-normal text-gray-900 mb-4">
        휘도 히트맵 (Falsecolor)
      </h3>

      {/* 휘도 스케일 조정 */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm text-gray-700">휘도 스케일</label>
          <span className="text-sm text-gray-800 font-medium">{scale} cd/m²</span>
        </div>
        <input
          type="range"
          min="100"
          max="12000"
          step="100"
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-800 mt-1">
          <span>100</span>
          <span>12000</span>
        </div>
      </div>

      {/* Falsecolor 이미지 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        key={`${filename}-${scale}`}  // 파일/스케일 변경 시 재렌더링
        className="relative w-full aspect-video"
      >
        <Image
          src={falsecolorUrl}
          alt={`Falsecolor: ${filename}`}
          fill
          className="object-contain border border-gray-200"
          unoptimized  // 동적 이미지는 최적화 스킵
        />
      </motion.div>

      {/* 설명 */}
      <div className="mt-4 p-3 border-t border-gray-200">
        <p className="text-xs text-gray-800">
          빨강 = 높은 휘도 (밝음) | 파랑 = 낮은 휘도 (어두움)
          <br />
          스케일을 조정하여 관심 영역을 강조할 수 있습니다.
        </p>
      </div>
    </div>
  )
}
