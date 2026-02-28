'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { logger } from '@/lib/logger'
import { useApiClient } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import FileUpload from '@/components/GlareAnalysis/FileUpload'

export default function FileConversion() {
  const api = useApiClient()
  const { showToast } = useToast()
  const [uploadedFiles, setUploadedFiles] = useState<FileList | null>(null)
  const [outputFormat, setOutputFormat] = useState<string>('png')
  const [toneMapping, setToneMapping] = useState(true)
  const [gamma, setGamma] = useState(2.2)
  const [converting, setConverting] = useState(false)

  const handleFilesSelected = (files: FileList) => {
    setUploadedFiles(files)
  }

  const handleClear = async () => {
    // 프론트엔드 초기화
    setUploadedFiles(null)
    setConverting(false)

    // 서버 초기화
    try {
      const data = await api.del('/clear')
      logger.debug('Server cleared', data)
    } catch (error) {
      logger.error('Clear error', error instanceof Error ? error : undefined)
      showToast({ type: 'error', message: '서버 초기화에 실패하였습니다' })
    }
  }

  const handleBatchConvert = async () => {
    if (!uploadedFiles || uploadedFiles.length === 0) return

    setConverting(true)
    try {
      // 0. 서버 폴더 완전 초기화!
      await api.del('/clear')

      // 1. 파일 업로드
      const formData = new FormData()
      Array.from(uploadedFiles).forEach(file => {
        formData.append('files', file)
      })

      await api.postFormData('/upload', formData)

      // 2. ZIP 일괄 변환 다운로드
      const path = `/convert/batch?output_format=${outputFormat}&tone_mapping=${toneMapping}&gamma=${gamma}`
      await api.downloadBlob(path, `converted_all_${outputFormat}.zip`, 'POST')

    } catch (error) {
      logger.error('Conversion error', error instanceof Error ? error : undefined)
      showToast({ type: 'error', message: '파일 변환 중 오류가 발생하였습니다' })
    } finally {
      setConverting(false)
    }
  }

  const formatInfo: Record<string, { category: string; desc: string }> = {
    'pic': { category: 'HDR', desc: 'Radiance HDR (기본)' },
    'hdr': { category: 'HDR', desc: 'Radiance HDR' },
    'tif': { category: 'HDR', desc: 'TIFF HDR' },
    'tiff': { category: 'HDR', desc: 'TIFF HDR' },
    'exr': { category: 'HDR', desc: 'OpenEXR (준비 중)' },
    'png': { category: 'LDR', desc: 'PNG (웹 호환)' },
    'jpg': { category: 'LDR', desc: 'JPEG (손실 압축)' },
    'jpeg': { category: 'LDR', desc: 'JPEG (손실 압축)' },
    'ppm': { category: 'Raw', desc: 'Portable Pixmap' },
    'bmp': { category: 'LDR', desc: 'Bitmap' }
  }

  const hdrFormats = Object.entries(formatInfo).filter(([, info]) => info.category === 'HDR')
  const ldrFormats = Object.entries(formatInfo).filter(([, info]) => info.category === 'LDR')
  const rawFormats = Object.entries(formatInfo).filter(([, info]) => info.category === 'Raw')

  const needsToneMapping = formatInfo[outputFormat]?.category === 'LDR'

  return (
    <div className="max-w-4xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-light text-gray-900 mb-6">
          파일 형식 변환
        </h2>
        <div className="w-24 h-px bg-gray-300 mb-6" />

        {/* 1. 파일 업로드 (드래그&드롭 + 다중 선택) */}
        <div className="border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-normal text-gray-900 mb-4">
            1. 파일 선택 (다중 선택 가능)
          </h3>

          <FileUpload
            onFilesSelected={handleFilesSelected}
            disabled={converting}
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
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {Array.from(uploadedFiles).slice(0, 10).map((file, i) => (
                  <p key={i} className="text-xs text-gray-800">
                    • {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                ))}
                {uploadedFiles.length > 10 && (
                  <p className="text-xs text-gray-800 italic">
                    ...외 {uploadedFiles.length - 10}개 파일
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. 출력 형식 선택 */}
        <div className="border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-normal text-gray-900 mb-4">
            2. 출력 형식 선택
          </h3>

          {/* HDR 형식 */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">HDR 형식 (High Dynamic Range)</p>
            <div className="grid grid-cols-4 gap-3">
              {hdrFormats.map(([fmt, info]) => (
                <button
                  key={fmt}
                  onClick={() => setOutputFormat(fmt)}
                  className={`border-2 p-3 transition-all text-left ${
                    outputFormat === fmt
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium text-gray-900">.{fmt}</div>
                  <div className="text-xs text-gray-800 mt-1">{info.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* LDR 형식 */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">LDR 형식 (웹/일반 용도, 톤 매핑 적용)</p>
            <div className="grid grid-cols-4 gap-3">
              {ldrFormats.map(([fmt, info]) => (
                <button
                  key={fmt}
                  onClick={() => setOutputFormat(fmt)}
                  className={`border-2 p-3 transition-all text-left ${
                    outputFormat === fmt
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium text-gray-900">.{fmt}</div>
                  <div className="text-xs text-gray-800 mt-1">{info.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Raw 형식 */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">원본 형식</p>
            <div className="grid grid-cols-4 gap-3">
              {rawFormats.map(([fmt, info]) => (
                <button
                  key={fmt}
                  onClick={() => setOutputFormat(fmt)}
                  className={`border-2 p-3 transition-all text-left ${
                    outputFormat === fmt
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="font-medium text-gray-900">.{fmt}</div>
                  <div className="text-xs text-gray-800 mt-1">{info.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. 변환 옵션 (LDR 선택 시만) */}
        {needsToneMapping && (
          <div className="border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-normal text-gray-900 mb-4">
              3. 변환 옵션
            </h3>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={toneMapping}
                  onChange={(e) => setToneMapping(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-gray-700">톤 매핑 적용 (HDR → LDR 자동 변환)</span>
              </label>

              {toneMapping && (
                <div>
                  <label className="text-sm text-gray-700 mb-2 block">
                    감마 보정 (γ={gamma})
                  </label>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    value={gamma}
                    onChange={(e) => setGamma(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-800 mt-1">
                    <span>1.0 (어두움)</span>
                    <span>2.2 (표준)</span>
                    <span>3.0 (밝음)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. 변환 실행 */}
        <div className="text-center">
          <button
            onClick={handleBatchConvert}
            disabled={!uploadedFiles || uploadedFiles.length === 0 || converting}
            className="border border-gray-200 hover:border-red-600/30 px-8 py-4 text-lg
              text-gray-900 hover:text-red-600 transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {converting ? `변환 중... (${uploadedFiles?.length || 0}개 파일)` :
             uploadedFiles && uploadedFiles.length > 0 ? `${uploadedFiles.length}개 파일을 .${outputFormat}으로 변환 및 다운로드` :
             '파일을 먼저 선택하세요'}
          </button>

          {uploadedFiles && uploadedFiles.length > 5 && (
            <p className="text-xs text-gray-800 mt-3">
              ⚠️ 여러 파일 다운로드 시 브라우저 팝업 차단 해제 필요
            </p>
          )}
        </div>

        {/* 설명 */}
        <div className="mt-8 p-6 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">지원 형식 및 설명</h4>

          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="font-medium text-gray-900 mb-2">HDR 형식</p>
              <ul className="space-y-1 text-xs text-gray-800">
                <li>• .pic, .hdr: Radiance 네이티브</li>
                <li>• .tif: TIFF HDR (32-bit float)</li>
                <li>• .exr: OpenEXR (준비 중)</li>
              </ul>
            </div>

            <div>
              <p className="font-medium text-gray-900 mb-2">LDR 형식</p>
              <ul className="space-y-1 text-xs text-gray-800">
                <li>• .png: 무손실, 웹 호환</li>
                <li>• .jpg: 손실 압축, 작은 용량</li>
                <li>• .bmp: Windows 호환</li>
              </ul>
            </div>

            <div>
              <p className="font-medium text-gray-900 mb-2">원본 형식</p>
              <ul className="space-y-1 text-xs text-gray-800">
                <li>• .ppm: Portable Pixmap</li>
                <li>• 변환 없이 원본 데이터</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-800">
              pyradiance 기반 형식 변환. 모든 Radiance 호환 형식 지원.
              LDR 변환 시 자동 톤 매핑 적용 (ra_ppm).
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
