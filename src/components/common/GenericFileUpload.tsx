'use client'

import { useState, useRef, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface GenericFileUploadProps {
  /** Accepted file extensions (e.g., ['.pic', '.hdr']) */
  acceptedExtensions: string[]
  /** Allow multiple file selection */
  multiple?: boolean
  /** File type label for display (e.g., 'Radiance HDR') */
  fileTypeLabel: string
  /** File type description (e.g., 'image files') */
  fileTypeDescription?: string
  /** Callback when files are selected and validated */
  onFilesSelected: (files: FileList) => void
  /** Disable the upload component */
  disabled?: boolean
  /** Show processing state */
  isProcessing?: boolean
  /** Processing message */
  processingMessage?: string
  /** Maximum files to display in list */
  maxDisplayFiles?: number
  /** Show file list after selection */
  showFileList?: boolean
  /** Custom error message */
  externalError?: string | null
  /** Maximum file size in bytes (default: no limit) */
  maxFileSize?: number
  /** Upload progress percentage (0-100). Show progress bar when set. */
  uploadProgress?: number | null
  /** Additional content below the drop zone */
  children?: ReactNode
}

type DropFeedback = 'none' | 'accepted' | 'rejected'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function GenericFileUpload({
  acceptedExtensions,
  multiple = true,
  fileTypeLabel,
  fileTypeDescription,
  onFilesSelected,
  disabled = false,
  isProcessing = false,
  processingMessage = 'Processing files...',
  maxDisplayFiles = 5,
  showFileList = true,
  externalError,
  maxFileSize,
  uploadProgress = null,
  children,
}: GenericFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dropFeedback, setDropFeedback] = useState<DropFeedback>('none')
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDisabled = disabled || isProcessing

  const showDropFeedback = useCallback((type: DropFeedback) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    setDropFeedback(type)
    feedbackTimerRef.current = setTimeout(() => setDropFeedback('none'), 600)
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!isDisabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (isDisabled) return

    const files = e.dataTransfer.files
    validateAndSetFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      validateAndSetFiles(files)
    }
  }

  const validateAndSetFiles = (files: FileList) => {
    setError(null)

    // Filter by accepted extensions
    const validFiles = Array.from(files).filter(f =>
      acceptedExtensions.some(ext => f.name.toLowerCase().endsWith(ext.toLowerCase()))
    )

    if (validFiles.length === 0) {
      const extList = acceptedExtensions.join(', ')
      setError(`${extList} 파일을 선택해주세요.`)
      showDropFeedback('rejected')
      return
    }

    // Check file size if maxFileSize is set
    if (maxFileSize) {
      const oversizedFiles = validFiles.filter(f => f.size > maxFileSize)
      if (oversizedFiles.length > 0) {
        const names = oversizedFiles.map(f => f.name).join(', ')
        setError(`파일 크기 초과 (최대 ${formatFileSize(maxFileSize)}): ${names}`)
        showDropFeedback('rejected')
        return
      }
    }

    if (validFiles.length !== files.length) {
      setError(`${files.length - validFiles.length}개의 지원하지 않는 파일이 제외되었습니다.`)
    }

    // Convert to FileList
    const dataTransfer = new DataTransfer()
    validFiles.forEach(file => dataTransfer.items.add(file))

    setSelectedFiles(dataTransfer.files)
    showDropFeedback('accepted')
    onFilesSelected(dataTransfer.files)
  }

  const handleClear = () => {
    setSelectedFiles(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const totalSize = selectedFiles
    ? Array.from(selectedFiles).reduce((sum, f) => sum + f.size, 0)
    : 0

  const acceptString = acceptedExtensions.join(',')
  const displayError = externalError || error

  const borderClasses = dropFeedback === 'accepted'
    ? 'border-green-500 bg-green-50'
    : dropFeedback === 'rejected'
    ? 'border-red-500 bg-red-50'
    : isDragging
    ? 'border-blue-500 bg-blue-50'
    : 'border-gray-300 hover:border-gray-400'

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8
          transition-all duration-300
          ${borderClasses}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={() => !isDisabled && fileInputRef.current?.click()}
        whileHover={!isDisabled ? { scale: 1.01 } : {}}
        whileTap={!isDisabled ? { scale: 0.99 } : {}}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptString}
          onChange={handleFileSelect}
          className="hidden"
          disabled={isDisabled}
          aria-label={`${fileTypeLabel} file upload`}
        />

        <div className="text-center">
          {/* Upload Icon */}
          <svg
            className={`mx-auto h-12 w-12 mb-4 transition-colors duration-300 ${
              isDragging ? 'text-blue-500' :
              dropFeedback === 'accepted' ? 'text-green-500' :
              dropFeedback === 'rejected' ? 'text-red-500' :
              'text-gray-500'
            }`}
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Main Text */}
          <p className="text-lg font-semibold text-gray-900 mb-2">
            {isProcessing
              ? processingMessage
              : isDragging
                ? `${acceptedExtensions.join('/')} 파일을 놓으세요`
                : `${acceptedExtensions.join('/')} 파일을 드래그하거나 클릭하세요`
            }
          </p>

          {/* Sub Text */}
          <p className="text-sm text-gray-800">
            {fileTypeLabel}
            {fileTypeDescription && ` - ${fileTypeDescription}`}
            {multiple && ' (다중 선택 가능)'}
          </p>
          {maxFileSize && (
            <p className="text-xs text-gray-400 mt-1">
              최대 {formatFileSize(maxFileSize)}
            </p>
          )}

          {/* Processing Spinner */}
          {isProcessing && (
            <div className="flex justify-center mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            </div>
          )}
        </div>
      </motion.div>

      {/* Upload Progress Bar */}
      <AnimatePresence>
        {uploadProgress !== null && uploadProgress >= 0 && uploadProgress < 100 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">업로드 중...</span>
              <span className="text-sm text-gray-600 tabular-nums">{Math.round(uploadProgress)}%</span>
            </div>
            <div
              className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(uploadProgress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="File upload progress"
            >
              <div
                className="h-full bg-red-600 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Files Info */}
      {showFileList && selectedFiles && selectedFiles.length > 0 && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-gray-200 p-6"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-normal text-gray-900">
                {selectedFiles.length}개 파일 선택됨
              </p>
              <p className="text-sm text-gray-800 mt-1">
                총 용량: {formatFileSize(totalSize)}
              </p>
            </div>

            <button
              onClick={handleClear}
              disabled={isDisabled}
              className="text-gray-800 hover:text-red-600 text-sm transition-colors disabled:opacity-50"
            >
              초기화
            </button>
          </div>

          {/* File List */}
          <div className="space-y-1 pt-4 border-t border-gray-200">
            {Array.from(selectedFiles)
              .slice(0, maxDisplayFiles)
              .map((file, i) => (
                <p key={i} className="text-xs text-gray-800 font-mono">
                  {file.name} ({formatFileSize(file.size)})
                </p>
              ))}

            {selectedFiles.length > maxDisplayFiles && (
              <p className="text-xs text-gray-800 italic">
                ...외 {selectedFiles.length - maxDisplayFiles}개 파일
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {displayError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border border-red-200 p-4 bg-red-50"
            role="alert"
          >
            <p className="text-sm text-red-600">{displayError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Additional Content */}
      {children}
    </div>
  )
}
