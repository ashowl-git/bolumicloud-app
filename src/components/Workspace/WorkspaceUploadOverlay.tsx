'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { CloudUpload } from 'lucide-react'

interface WorkspaceUploadOverlayProps {
  onFileSelect: (file: File, mtlFile?: File) => void
  accept?: string
  isUploading?: boolean
  hint?: string
  maxSizeMB?: number
}

export default function WorkspaceUploadOverlay({
  onFileSelect,
  accept = '.obj,.sn5f,.mtl',
  isUploading = false,
  hint = 'OBJ 또는 Sanalyst SN5F 파일을 드래그하세요 (최대 100MB)',
  maxSizeMB = 100,
}: WorkspaceUploadOverlayProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [sizeError, setSizeError] = useState<string | null>(null)
  const [fadePhase, setFadePhase] = useState<'visible' | 'fading' | 'hidden'>('visible')
  const inputRef = useRef<HTMLInputElement>(null)
  const prevUploading = useRef(isUploading)

  // Detect upload completion and trigger smooth fade-out
  useEffect(() => {
    if (prevUploading.current && !isUploading) {
      setFadePhase('fading')
      const timer = setTimeout(() => setFadePhase('hidden'), 600)
      return () => clearTimeout(timer)
    }
    prevUploading.current = isUploading
  }, [isUploading])

  const maxBytes = maxSizeMB * 1024 * 1024

  const validateAndSelect = useCallback((file: File, mtlFile?: File) => {
    if (file.size > maxBytes) {
      setSizeError(`파일 크기(${(file.size / 1024 / 1024).toFixed(1)}MB)가 ${maxSizeMB}MB 제한을 초과합니다`)
      return
    }
    setSizeError(null)
    onFileSelect(file, mtlFile)
  }, [maxBytes, maxSizeMB, onFileSelect])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (isUploading) return
      const files = Array.from(e.dataTransfer.files)
      const valid = files.find((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase()
        return accept.includes(`.${ext}`)
      })
      if (valid) {
        // MTL 파일이 함께 드래그되었는지 확인
        const mtl = files.find((f) => f.name.toLowerCase().endsWith('.mtl'))
        validateAndSelect(valid, mtl || undefined)
      }
    },
    [accept, isUploading, validateAndSelect]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return
      const files = Array.from(e.target.files)
      const main = files.find((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase()
        return ext === 'obj' || ext === 'sn5f'
      })
      if (main) {
        const mtl = files.find((f) => f.name.toLowerCase().endsWith('.mtl'))
        validateAndSelect(main, mtl || undefined)
      }
      e.target.value = ''
    },
    [validateAndSelect]
  )

  if (fadePhase === 'hidden') return null

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center z-10
        transition-opacity duration-500 ease-out
        ${fadePhase === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onDragOver={(e) => {
        e.preventDefault()
        if (!isUploading) setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`bg-white/95 rounded-xl border-2 border-dashed p-14 text-center
          max-w-md mx-4 transition-all duration-300 shadow-2xl ${
            isUploading
              ? 'border-gray-300 cursor-not-allowed opacity-80'
              : isDragging
              ? 'border-red-500 bg-red-50/90 scale-105 shadow-red-200/50'
              : 'border-gray-300 hover:border-red-400 cursor-pointer'
          }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleChange}
          className="hidden"
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="space-y-4">
            <div className="w-10 h-10 border-[2.5px] border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-gray-600">업로드 중...</p>
            <p className="text-xs text-gray-400">잠시만 기다려 주세요</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
              <CloudUpload size={32} strokeWidth={1.3} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">OBJ / SN5F 파일을 드래그하거나 클릭하세요</p>
              <p className="text-xs text-gray-400 mt-1.5">{hint}</p>
              {sizeError && (
                <p className="text-xs text-red-500 mt-2 font-medium">{sizeError}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
