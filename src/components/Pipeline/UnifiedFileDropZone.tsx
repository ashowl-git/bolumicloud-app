'use client'

import { useRef, useState, useCallback } from 'react'
import { CloudUpload } from 'lucide-react'

interface ClassifiedFiles {
  vfFiles: File[]
  obj: File | null
  mtl: File | null
}

const MAX_FILE_SIZE_MB = 100
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

interface UnifiedFileDropZoneProps {
  onFilesClassified: (files: ClassifiedFiles) => void
  currentFiles: ClassifiedFiles
  disabled?: boolean
  isProcessing?: boolean
}

function classifyFiles(fileList: File[], existing: ClassifiedFiles): ClassifiedFiles {
  const result = { ...existing, vfFiles: [...existing.vfFiles] }

  for (const file of fileList) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'vf') {
      // VF: 누적 (중복 파일명 교체)
      const existingIdx = result.vfFiles.findIndex(f => f.name === file.name)
      if (existingIdx >= 0) {
        result.vfFiles[existingIdx] = file
      } else {
        result.vfFiles.push(file)
      }
    } else if (ext === 'obj') {
      result.obj = file
    } else if (ext === 'mtl') {
      result.mtl = file
    }
  }

  return result
}

export default function UnifiedFileDropZone({
  onFilesClassified,
  currentFiles,
  disabled,
  isProcessing,
}: UnifiedFileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [unknownFiles, setUnknownFiles] = useState<string[]>([])
  const [oversizedFiles, setOversizedFiles] = useState<string[]>([])

  const processFiles = useCallback(
    (fileList: File[]) => {
      const unknowns: string[] = []
      const oversized: string[] = []
      const valid: File[] = []

      for (const file of fileList) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          oversized.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
          continue
        }
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (ext === 'vf' || ext === 'obj' || ext === 'mtl') {
          valid.push(file)
        } else {
          unknowns.push(file.name)
        }
      }

      setUnknownFiles(unknowns)
      setOversizedFiles(oversized)
      if (valid.length > 0) {
        const classified = classifyFiles(valid, currentFiles)
        onFilesClassified(classified)
      }
    },
    [currentFiles, onFilesClassified]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (disabled || isProcessing) return
      const files = Array.from(e.dataTransfer.files)
      processFiles(files)
    },
    [disabled, isProcessing, processFiles]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return
      const files = Array.from(e.target.files)
      processFiles(files)
      e.target.value = ''
    },
    [processFiles]
  )

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!disabled && !isProcessing) inputRef.current?.click()
          }
        }}
        aria-label="파일 업로드"
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled && !isProcessing) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !isProcessing && inputRef.current?.click()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
          disabled || isProcessing
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
            : isDragging
            ? 'border-red-600 bg-red-50'
            : 'border-gray-300 hover:border-red-600/30'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".vf,.obj,.mtl"
          multiple
          onChange={handleChange}
          className="hidden"
          disabled={disabled || isProcessing}
        />

        {isProcessing ? (
          <div className="space-y-2">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-600">업로드 중...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <CloudUpload size={32} strokeWidth={1.5} className="mx-auto text-gray-400" />
            <p className="text-sm text-gray-700">
              SketchUp 파일을 드래그하거나 클릭하세요
            </p>
            <p className="text-xs text-gray-400">
              .vf (복수), .obj, .mtl 파일을 한 번에 업로드할 수 있습니다
            </p>
          </div>
        )}
      </div>

      {oversizedFiles.length > 0 && (
        <p className="text-xs text-red-500 mt-2">
          파일 크기 초과 (최대 {MAX_FILE_SIZE_MB}MB): {oversizedFiles.join(', ')}
        </p>
      )}
      {unknownFiles.length > 0 && (
        <p className="text-xs text-red-500 mt-2">
          인식할 수 없는 파일: {unknownFiles.join(', ')}
        </p>
      )}
    </div>
  )
}
