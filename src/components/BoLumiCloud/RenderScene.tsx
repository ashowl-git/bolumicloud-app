'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { logger } from '@/lib/logger'
import { useApiClient } from '@/lib/api'
import { useApi } from '@/contexts/ApiContext'
import { useToast } from '@/contexts/ToastContext'

export default function RenderScene() {
  const api = useApiClient()
  const { apiUrl } = useApi()
  const { showToast } = useToast()
  const [files, setFiles] = useState<string[]>([])
  const [sceneFile, setSceneFile] = useState('')
  const [viewFile, setViewFile] = useState('')
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpg' | 'hdr'>('png')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [renderTime, setRenderTime] = useState<number>(0)

  // 파일 목록 로드
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const data = await api.get('/files')
        const radFiles = data.files.filter((f: string) =>
          /\.(rad|oct|vf)$/i.test(f)
        )
        setFiles(radFiles)
      } catch (e) {
        logger.error('Failed to load files', e instanceof Error ? e : undefined)
        showToast({ type: 'error', message: '파일 목록을 불러오지 못하였습니다' })
      }
    }

    loadFiles()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl])

  const handleRender = async () => {
    if (!sceneFile) return

    setLoading(true)
    setRenderTime(0)
    const startTime = Date.now()

    try {
      const params = new URLSearchParams({
        scene_file: sceneFile,
        quality,
        output_format: outputFormat
      })

      if (viewFile) {
        params.append('view_file', viewFile)
      }

      const path = `/render/scene?${params.toString()}`
      const blob = await api.postBlob(path)
      setResult(URL.createObjectURL(blob))
      setRenderTime((Date.now() - startTime) / 1000)
    } catch (e) {
      logger.error('Render error', e instanceof Error ? e : undefined)
      showToast({ type: 'error', message: '렌더링 중 오류가 발생하였습니다' })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (result) {
      const link = document.createElement('a')
      link.href = result
      link.download = `render_${quality}_${Date.now()}.${outputFormat}`
      link.click()
    }
  }

  const qualityInfo = {
    low: { label: 'Low', desc: '빠른 프리뷰', params: 'ab=2, ar=64' },
    medium: { label: 'Medium', desc: '균형', params: 'ab=3, ar=128' },
    high: { label: 'High', desc: '고품질', params: 'ab=5, ar=256' }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-normal text-gray-900 mb-4">3D 렌더링</h2>
        <p className="text-sm text-gray-800 mb-6">
          Radiance rpict를 사용한 포토리얼리스틱 렌더링
        </p>

        <div className="border border-gray-200 p-6 space-y-4">
          {/* 씬 파일 선택 */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              씬 파일 (필수)
            </label>
            <select
              value={sceneFile}
              onChange={(e) => setSceneFile(e.target.value)}
              className="w-full border border-gray-200 px-4 py-2 focus:outline-none focus:border-red-600/30 transition-colors"
            >
              <option value="">씬 파일을 선택하세요 (.rad, .oct)</option>
              {files.filter(f => /\.(rad|oct)$/i.test(f)).map((file) => (
                <option key={file} value={file}>
                  {file}
                </option>
              ))}
            </select>
          </div>

          {/* 뷰 파일 선택 (선택사항) */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              뷰 파일 (선택사항)
            </label>
            <select
              value={viewFile}
              onChange={(e) => setViewFile(e.target.value)}
              className="w-full border border-gray-200 px-4 py-2 focus:outline-none focus:border-red-600/30 transition-colors"
            >
              <option value="">기본 뷰 사용</option>
              {files.filter(f => /\.vf$/i.test(f)).map((file) => (
                <option key={file} value={file}>
                  {file}
                </option>
              ))}
            </select>
          </div>

          {/* 품질 선택 */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">품질</label>
            <div className="grid md:grid-cols-3 gap-3">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`border p-3 text-sm transition-all duration-300 ${
                    quality === q
                      ? 'border-red-600 bg-red-50 text-gray-900'
                      : 'border-gray-200 hover:border-red-600/30 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{qualityInfo[q].label}</div>
                  <div className="text-xs text-gray-800 mt-1">
                    {qualityInfo[q].desc}
                  </div>
                  <div className="text-xs text-gray-700 mt-1">
                    {qualityInfo[q].params}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 출력 포맷 */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">출력 포맷</label>
            <div className="flex gap-4">
              {(['png', 'jpg', 'hdr'] as const).map((format) => (
                <label key={format} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={outputFormat === format}
                    onChange={() => setOutputFormat(format)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">
                    {format.toUpperCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 렌더링 버튼 */}
          <button
            onClick={handleRender}
            disabled={!sceneFile || loading}
            className="w-full border border-gray-200 hover:border-red-600/30 px-6 py-3
              text-gray-900 hover:text-red-600 transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '렌더링 중...' : '렌더링 시작'}
          </button>
        </div>
      </div>

      {/* 결과 */}
      {result && (
        <div className="border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-normal text-gray-900">렌더링 결과</h3>
            <div className="flex gap-3 items-center">
              <span className="text-xs text-gray-800">
                소요 시간: {renderTime.toFixed(1)}초
              </span>
              <button
                onClick={handleDownload}
                className="px-4 py-2 text-xs border border-gray-200 hover:border-red-600/30 transition-colors"
              >
                다운로드
              </button>
            </div>
          </div>

          <div className="border border-gray-200">
            {outputFormat === 'hdr' ? (
              <div className="p-8 bg-amber-50/50 text-center">
                <p className="text-sm text-gray-800">
                  HDR 파일이 다운로드되었습니다.
                </p>
                <p className="text-xs text-gray-800 mt-2">
                  HDR 뷰어로 확인하세요.
                </p>
              </div>
            ) : (
              <div className="relative w-full min-h-[300px]">
                <Image
                  src={result}
                  alt="Rendered scene"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-4 text-xs text-gray-800">
            <div>
              <span className="font-medium">씬:</span> {sceneFile}
            </div>
            <div>
              <span className="font-medium">뷰:</span> {viewFile || '기본 뷰'}
            </div>
            <div>
              <span className="font-medium">품질:</span> {qualityInfo[quality].label}
            </div>
            <div>
              <span className="font-medium">포맷:</span> {outputFormat.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      <div className="border border-gray-200 p-6 text-sm text-gray-800">
        <h4 className="font-medium text-gray-900 mb-2">품질 옵션</h4>
        <ul className="space-y-1">
          <li>• <span className="font-medium">Low</span>: 빠른 프리뷰 (ab=2, ar=64)</li>
          <li>• <span className="font-medium">Medium</span>: 균형 (ab=3, ar=128)</li>
          <li>• <span className="font-medium">High</span>: 고품질 (ab=5, ar=256)</li>
        </ul>
        <p className="mt-4 text-xs text-gray-800">
          ab: Ambient bounces | ar: Ambient resolution | ad: Ambient divisions
        </p>
      </div>
    </motion.div>
  )
}
