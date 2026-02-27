'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { logger } from '@/lib/logger'

interface ToneMappingProps {
  apiUrl: string
}

export default function ToneMapping({ apiUrl }: ToneMappingProps) {
  const [files, setFiles] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState('')
  const [humanSensitivity, setHumanSensitivity] = useState(true)
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpg'>('png')
  const [, setOriginal] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 파일 목록 로드
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const res = await fetch(`${apiUrl}/files`)
        const data = await res.json()
        const imageFiles = data.files.filter((f: string) =>
          /\.(pic|hdr|tif|tiff|exr)$/i.test(f)
        )
        setFiles(imageFiles)
      } catch (e) {
        logger.error('Failed to load files', e instanceof Error ? e : undefined)
      }
    }

    loadFiles()
  }, [apiUrl])

  // 파일 선택 시 원본 이미지 표시 (이미 톤 매핑된 것으로 간주)
  useEffect(() => {
    if (selectedFile) {
      // 원본 파일은 직접 접근 불가하므로, 기존 톤 매핑된 버전 표시
      setOriginal(`${apiUrl}/static/${selectedFile}`)
    }
  }, [selectedFile, apiUrl])

  const handleProcess = async () => {
    if (!selectedFile) return

    setLoading(true)
    try {
      const res = await fetch(
        `${apiUrl}/process/tone-mapping?filename=${selectedFile}&human_sensitivity=${humanSensitivity}&output_format=${outputFormat}`,
        { method: 'POST' }
      )

      if (res.ok) {
        const blob = await res.blob()
        setResult(URL.createObjectURL(blob))
      }
    } catch (e) {
      logger.error('Tone mapping error', e instanceof Error ? e : undefined)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (result) {
      const link = document.createElement('a')
      link.href = result
      link.download = `tonemapped_${selectedFile.replace(/\.\w+$/, `.${outputFormat}`)}`
      link.click()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-normal text-gray-900 mb-4">톤 매핑 (pcond)</h2>
        <p className="text-sm text-gray-800 mb-6">
          HDR 이미지를 인간 시각에 맞게 조정합니다 (Photographic tone reproduction)
        </p>

        <div className="border border-gray-200 p-6 space-y-4">
          {/* 파일 선택 */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">파일 선택</label>
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="w-full border border-gray-200 px-4 py-2 focus:outline-none focus:border-red-600/30 transition-colors"
            >
              <option value="">파일을 선택하세요</option>
              {files.map((file) => (
                <option key={file} value={file}>
                  {file}
                </option>
              ))}
            </select>
          </div>

          {/* 옵션 */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Human Sensitivity */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={humanSensitivity}
                onChange={(e) => setHumanSensitivity(e.target.checked)}
                id="human-sensitivity"
                className="w-4 h-4"
              />
              <label htmlFor="human-sensitivity" className="text-sm text-gray-700">
                인간 시각 적응 (Human sensitivity)
              </label>
            </div>

            {/* 출력 포맷 */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">출력 포맷:</span>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={outputFormat === 'png'}
                  onChange={() => setOutputFormat('png')}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">PNG</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={outputFormat === 'jpg'}
                  onChange={() => setOutputFormat('jpg')}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">JPG</span>
              </label>
            </div>
          </div>

          {/* 처리 버튼 */}
          <button
            onClick={handleProcess}
            disabled={!selectedFile || loading}
            className="border border-gray-200 hover:border-red-600/30 px-6 py-3
              text-gray-900 hover:text-red-600 transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '처리 중...' : '톤 매핑 적용'}
          </button>
        </div>
      </div>

      {/* Before/After 비교 */}
      {result && (
        <div className="border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-normal text-gray-900">Before / After</h3>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-xs border border-gray-200 hover:border-red-600/30 transition-colors"
            >
              다운로드
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Before */}
            <div>
              <p className="text-xs text-gray-800 mb-2">Before (Original HDR)</p>
              <div className="border border-gray-200 p-4 bg-amber-50/50">
                <p className="text-xs text-gray-700">
                  {selectedFile}
                </p>
                <p className="text-xs text-gray-700 mt-1">
                  HDR 파일은 직접 미리보기 불가
                </p>
              </div>
            </div>

            {/* After */}
            <div>
              <p className="text-xs text-gray-800 mb-2">After (Tone Mapped)</p>
              <div className="border border-gray-200 relative min-h-[200px]">
                <Image
                  src={result}
                  alt="Tone mapped"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border border-gray-200 p-6 text-sm text-gray-800">
        <h4 className="font-medium text-gray-900 mb-2">pcond란?</h4>
        <p>HDR 이미지를 모니터에서 보기 적합하게 변환하는 도구입니다.</p>
        <p className="mt-2">인간 시각의 밝기 적응을 시뮬레이션하여 자연스러운 결과를 생성합니다.</p>
      </div>
    </motion.div>
  )
}
