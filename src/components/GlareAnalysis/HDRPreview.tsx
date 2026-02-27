'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface HDRPreviewProps {
  filename: string
  apiUrl: string
}

export default function HDRPreview({ filename, apiUrl }: HDRPreviewProps) {
  // 기본 설정 (간단하게!)
  const previewUrl = `${apiUrl}/glare/preview/${filename}?exposure=1.0`

  return (
    <div className="border border-gray-200 p-6">
      <h3 className="text-lg font-normal text-gray-900 mb-4">
        HDR 이미지 미리보기
      </h3>

      {/* HDR 미리보기 이미지 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        key={filename}  // 파일 변경 시 재렌더링
        className="relative w-full aspect-video"
      >
        <Image
          src={previewUrl}
          alt={`HDR Preview: ${filename}`}
          fill
          className="object-contain border border-gray-200"
          unoptimized  // 동적 이미지는 최적화 스킵
        />
      </motion.div>

      {/* 설명 */}
      <div className="mt-4 p-3 border-t border-gray-200">
        <p className="text-xs text-gray-800">
          HDR 이미지를 일반 모니터에서 볼 수 있도록 변환했습니다.
          <br />
          원본 톤 매핑 (exposure=1.0) 상태입니다.
        </p>
      </div>
    </div>
  )
}
