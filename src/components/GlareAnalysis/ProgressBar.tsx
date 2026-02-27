'use client'

import { motion } from 'framer-motion'

interface ProgressBarProps {
  progress: number
  currentFile?: string
  processed?: number
  total?: number
  status?: 'uploading' | 'analyzing' | 'complete'
}

export default function ProgressBar({
  progress,
  currentFile,
  processed,
  total,
  status = 'analyzing'
}: ProgressBarProps) {
  const statusText = {
    uploading: '업로드 중...',
    analyzing: '분석 중...',
    complete: '완료'
  }

  return (
    <div className="border border-gray-200 p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-normal text-gray-900">
            {statusText[status]}
          </h3>

          <span className="text-sm text-gray-800">
            {processed && total ? `${processed}/${total}` : `${Math.round(progress)}%`}
          </span>
        </div>

        {/* 프로그레스 바 */}
        <div className="w-full bg-gray-200 h-2">
          <motion.div
            className="bg-red-600 h-2"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* 현재 처리 중인 파일 */}
      {currentFile && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 pt-4 border-t border-gray-200"
        >
          <p className="text-sm text-gray-800">처리 중:</p>
          <p className="text-sm text-gray-900 font-mono">
            {currentFile}
          </p>
        </motion.div>
      )}

      {/* 예상 시간 */}
      {status === 'analyzing' && total && processed && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-800">
          {processed < total && (
            <p>
              예상 남은 시간: {Math.ceil((total - processed) * 3.3)} 초
            </p>
          )}
        </div>
      )}
    </div>
  )
}
