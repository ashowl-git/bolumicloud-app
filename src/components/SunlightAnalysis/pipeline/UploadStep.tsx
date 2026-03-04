'use client'

import { useRef, useState, useCallback } from 'react'
import { CloudUpload, CheckCircle } from 'lucide-react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import type { LocalizedText } from '@/lib/types/i18n'
import type { ModelMetadata } from '@/lib/types/sunlight'
import ModelLoadingSkeleton from '@/components/common/ModelLoadingSkeleton'
import CameraPresetBar from '@/components/shared/3d/CameraPresetBar'
import type { CameraPresetId, ModelConfig } from '@/components/shared/3d/types'
import { useModelLoader } from '@/components/shared/3d/useModelLoader'

const MAX_OBJ_SIZE = 100 * 1024 * 1024  // 100MB
const MAX_SN5F_SIZE = 20 * 1024 * 1024  // 20MB
const SUPPORTED_FORMATS = ['obj', 'sn5f', 'dxf']

import dynamic from 'next/dynamic'
const ThreeViewer = dynamic(() => import('@/components/shared/3d/ThreeViewer'), { ssr: false })
const BuildingModel = dynamic(() => import('@/components/shared/3d/BuildingModel'), { ssr: false })
const GroundGrid = dynamic(() => import('@/components/shared/3d/GroundGrid'), { ssr: false })
const CompassRose = dynamic(() => import('@/components/shared/3d/CompassRose'), { ssr: false })
const SceneLighting = dynamic(() => import('@/components/shared/3d/SceneLighting'), { ssr: false })

const txt = {
  uploadBtn: { ko: 'OBJ 파일 업로드', en: 'Upload OBJ File' } as LocalizedText,
  uploading: { ko: '업로드 중...', en: 'Uploading...' } as LocalizedText,
  continue: { ko: '다음', en: 'Continue' } as LocalizedText,
  dropzone: { ko: 'OBJ 파일을 드래그하거나 클릭하세요', en: 'Drag or click to upload OBJ file' } as LocalizedText,
  dropzoneHint: { ko: '.obj 파일 (최대 100MB)', en: '.obj file (max 100MB)' } as LocalizedText,
}

export interface UploadStepProps {
  sessionId: string | null
  sceneUrl: string | null
  modelMeta: ModelMetadata | null
  isUploading: boolean
  onUpload: (file: File) => Promise<void>
  onContinue: () => void
  cameraPreset: CameraPresetId
  onCameraPresetChange: (preset: CameraPresetId) => void
}

export default function UploadStep({
  sessionId,
  sceneUrl,
  modelMeta,
  isUploading,
  onUpload,
  onContinue,
  cameraPreset,
  onCameraPresetChange,
}: UploadStepProps) {
  const { t } = useLocalizedText()
  const inputRef = useRef<HTMLInputElement>(null)
  const [objFile, setObjFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const modelConfig: ModelConfig | null = sceneUrl
    ? { url: sceneUrl, format: 'glb', autoCenter: true, zUp: false }
    : null
  const { state: modelState, scene: modelScene, bbox: modelBbox } = useModelLoader(modelConfig)

  const validateFile = useCallback((file: File): boolean => {
    setFileError(null)
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!SUPPORTED_FORMATS.includes(ext || '')) {
      setFileError(`지원하지 않는 파일 형식입니다. (${SUPPORTED_FORMATS.join(', ')} 파일만 업로드 가능합니다)`)
      return false
    }
    const maxSize = ext === 'obj' ? MAX_OBJ_SIZE : MAX_SN5F_SIZE
    if (file.size > maxSize) {
      setFileError(`파일 크기가 ${maxSize / (1024 * 1024)}MB를 초과합니다. (현재: ${(file.size / (1024 * 1024)).toFixed(1)}MB)`)
      return false
    }
    return true
  }, [])

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      const target = files[0]
      if (target && validateFile(target)) setObjFile(target)
    },
    [validateFile]
  )

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    const target = files[0]
    if (target && validateFile(target)) setObjFile(target)
    e.target.value = ''
  }, [validateFile])

  const handleUpload = useCallback(async () => {
    if (!objFile) return
    setUploadSuccess(false)
    await onUpload(objFile)
    setUploadSuccess(true)
    setTimeout(() => setUploadSuccess(false), 3000)
  }, [objFile, onUpload])

  const canUpload = !!objFile && !isUploading

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!isUploading && !sessionId) inputRef.current?.click()
          }
        }}
        aria-label="파일 업로드"
        onDragOver={(e) => {
          e.preventDefault()
          if (!isUploading && !sessionId) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        onClick={() => !isUploading && !sessionId && inputRef.current?.click()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
          isUploading || sessionId
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
            : isDragging
            ? 'border-red-600 bg-red-50'
            : 'border-gray-300 hover:border-red-600/30'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".obj,.sn5f,.dxf"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading || !!sessionId}
        />
        {isUploading ? (
          <div className="space-y-2">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-600">{t(txt.uploading)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <CloudUpload size={32} strokeWidth={1.5} className="mx-auto text-gray-400" />
            <p className="text-sm text-gray-700">{t(txt.dropzone)}</p>
            <p className="text-xs text-gray-400">{t(txt.dropzoneHint)}</p>
          </div>
        )}
      </div>

      {/* File Validation Error */}
      {fileError && (
        <p className="text-sm text-red-500" role="alert">{fileError}</p>
      )}

      {/* Upload Success Toast */}
      {uploadSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 text-sm" role="status">
          <CheckCircle size={16} />
          <span>파일이 업로드되었습니다.</span>
        </div>
      )}

      {/* Selected File */}
      {objFile && (
        <div className="border border-gray-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">{objFile.name}</p>
            <p className="text-xs text-gray-400">
              {(objFile.size / (1024 * 1024)).toFixed(1)} MB
            </p>
          </div>
          {!sessionId && (
            <button
              onClick={() => setObjFile(null)}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              제거
            </button>
          )}
        </div>
      )}

      {/* Upload Button */}
      {canUpload && !sessionId && (
        <div className="pt-2">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="border border-gray-200 hover:border-red-600/30 px-8 py-3
              text-gray-900 hover:text-red-600 transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? t(txt.uploading) : t(txt.uploadBtn)}
          </button>
        </div>
      )}

      {/* 3D Preview after upload */}
      {sessionId && modelState === 'loaded' && modelScene && (
        <div className="border border-gray-200 relative">
          <ThreeViewer bbox={modelBbox} height="360px">
            <SceneLighting />
            <BuildingModel scene={modelScene} bbox={modelBbox} />
            <GroundGrid bbox={modelBbox} />
            <CompassRose bbox={modelBbox} />
          </ThreeViewer>
          <CameraPresetBar
            bbox={modelBbox}
            activePreset={cameraPreset}
            onPresetChange={onCameraPresetChange}
          />
          {modelMeta && (
            <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                V: {modelMeta.vertices.toLocaleString()} | F: {modelMeta.faces.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400">{modelMeta.original_name}</span>
            </div>
          )}
        </div>
      )}
      {sessionId && modelState === 'loading' && (
        <ModelLoadingSkeleton height="360px" message="3D 모델 변환 중..." />
      )}

      {/* Continue to Settings */}
      {sessionId && (
        <div className="pt-2">
          <button
            onClick={onContinue}
            className="border border-gray-200 hover:border-red-600/30 px-8 py-3
              text-gray-900 hover:text-red-600 transition-all duration-300"
          >
            {t(txt.continue)}
          </button>
        </div>
      )}
    </div>
  )
}
