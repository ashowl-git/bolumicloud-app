'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { logger } from '@/lib/logger'
import { useApiClient } from '@/lib/api'
import { useApi } from '@/contexts/ApiContext'
import { useToast } from '@/contexts/ToastContext'
import FileUpload from '@/components/GlareAnalysis/FileUpload'

export default function ImageProcessing() {
  const api = useApiClient()
  const { apiUrl } = useApi()
  const { showToast } = useToast()
  const [uploadedFiles, setUploadedFiles] = useState<FileList | null>(null)
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [exposure, setExposure] = useState(1.0)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [originalUrl, setOriginalUrl] = useState<string>('')

  const handleFilesSelected = (files: FileList) => {
    setUploadedFiles(files)
    if (files.length > 0) {
      setSelectedFile(files[0].name)
    }
  }

  const handleClear = async () => {
    setUploadedFiles(null)
    setSelectedFile('')
    setPreviewUrl('')
    setOriginalUrl('')
    setProcessing(false)

    try {
      await api.del('/clear')
    } catch (error) {
      logger.error('Clear error', error instanceof Error ? error : undefined)
      showToast({ type: 'error', message: '서버 초기화에 실패하였습니다' })
    }
  }

  const handleProcess = async () => {
    if (!uploadedFiles || !selectedFile) return

    setProcessing(true)
    try {
      // 1. 서버 초기화
      await api.del('/clear')

      // 2. 파일 업로드
      const formData = new FormData()
      Array.from(uploadedFiles).forEach(file => {
        formData.append('files', file)
      })

      await api.postFormData('/upload', formData)

      // 3. 원본 미리보기
      setOriginalUrl(`${apiUrl}/glare/preview/${selectedFile}?t=${Date.now()}`)

      // 4. 처리된 이미지 생성 (blob for preview)
      const path = `/process/adjust?filename=${selectedFile}&exposure=${exposure}&xres=${width}&yres=${height}`
      const blob = await api.postBlob(path)
      const objectUrl = URL.createObjectURL(blob)
      setPreviewUrl(objectUrl)

    } catch (error) {
      logger.error('Processing error', error instanceof Error ? error : undefined)
      showToast({ type: 'error', message: '이미지 처리 중 오류가 발생하였습니다' })
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `adjusted_${selectedFile.replace(/\.[^.]+$/, '.png')}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="max-w-6xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-light text-gray-900 mb-6">
          이미지 처리
        </h2>
        <div className="w-24 h-px bg-gray-300 mb-6" />

        {/* 1. 파일 업로드 */}
        <div className="border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-normal text-gray-900 mb-4">
            1. 파일 선택
          </h3>

          <FileUpload
            onFilesSelected={handleFilesSelected}
            disabled={processing}
          />

          {uploadedFiles && uploadedFiles.length > 0 && (
            <div className="mt-4 p-4 border border-gray-200 bg-amber-50/50">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-gray-900">
                  {uploadedFiles.length}개 파일 선택됨
                </p>
                <button
                  onClick={handleClear}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  초기화
                </button>
              </div>

              {/* 파일 목록 */}
              <div className="space-y-2 mt-4">
                {Array.from(uploadedFiles).map((file, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedFile(file.name)}
                    className={`w-full text-left px-3 py-2 text-sm border transition-all ${
                      selectedFile === file.name
                        ? 'border-red-600 bg-red-50'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. 조정 옵션 */}
        <div className="border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-normal text-gray-900 mb-4">
            2. 조정 옵션
          </h3>

          {/* Exposure */}
          <div className="mb-6">
            <label className="text-sm text-gray-700 mb-2 block">
              노출 (Exposure) = {exposure.toFixed(2)}x
            </label>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={exposure}
              onChange={(e) => setExposure(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-800 mt-1">
              <span>0.1x (어두움)</span>
              <span>1.0x (원본)</span>
              <span>10x (밝음)</span>
            </div>
          </div>

          {/* 해상도 */}
          <div>
            <label className="text-sm text-gray-700 mb-2 block">
              해상도 조정 (선택사항)
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Width (px)"
                  value={width || ''}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center text-gray-700">
                ×
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Height (px)"
                  value={height || ''}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-gray-800 mt-2">
              비워두면 원본 해상도 유지
            </p>
          </div>
        </div>

        {/* 3. 처리 실행 */}
        <div className="text-center mb-6">
          <button
            onClick={handleProcess}
            disabled={!selectedFile || processing}
            className="border border-gray-200 hover:border-red-600/30 px-8 py-3 text-base
              text-gray-900 hover:text-red-600 transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? '처리 중...' :
             selectedFile ? `처리 실행` :
             '파일을 먼저 선택하세요'}
          </button>
        </div>

        {/* 4. Before/After 비교 */}
        {(originalUrl || previewUrl) && (
          <div className="border border-gray-200 p-6">
            <h3 className="text-lg font-normal text-gray-900 mb-4">
              Before / After
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Before */}
              <div>
                <p className="text-sm text-gray-800 mb-3">Before (원본)</p>
                <div className="border border-gray-200 bg-amber-50/50 relative min-h-[200px]">
                  {originalUrl && (
                    <Image
                      src={originalUrl}
                      alt="Original"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  )}
                </div>
              </div>

              {/* After */}
              <div>
                <p className="text-sm text-gray-800 mb-3">
                  After (노출 {exposure.toFixed(2)}x
                  {width > 0 && height > 0 && `, ${width}×${height}px`})
                </p>
                <div className="border border-gray-200 bg-amber-50/50 relative min-h-[200px]">
                  {previewUrl && (
                    <Image
                      src={previewUrl}
                      alt="Processed"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 다운로드 버튼 */}
            {previewUrl && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleDownload}
                  className="border border-gray-200 hover:border-red-600/30 px-6 py-3
                    text-gray-900 hover:text-red-600 transition-all duration-300"
                >
                  처리된 이미지 다운로드
                </button>
              </div>
            )}
          </div>
        )}

        {/* 설명 */}
        <div className="mt-8 p-6 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">기능 설명</h4>

          <div className="space-y-3 text-sm text-gray-800">
            <p>
              <span className="font-medium text-gray-900">노출 조정:</span> pfilt exposure 기능으로 이미지 밝기를 조정합니다.
              0.1x (매우 어둡게) ~ 10x (매우 밝게)
            </p>
            <p>
              <span className="font-medium text-gray-900">해상도 조정:</span> pfilt xres/yres 기능으로 이미지 크기를 변경합니다.
              고품질 리샘플링 적용
            </p>
            <p className="text-xs text-gray-800">
              pyradiance.pfilt 기반 전문가급 이미지 처리
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
