'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface ModelLoadingSkeletonProps {
  height?: string
  message?: string
}

export default function ModelLoadingSkeleton({
  height = '360px',
  message = '3D 모델 로딩 중...',
}: ModelLoadingSkeletonProps) {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div
      className="border border-gray-200 bg-gray-50 flex flex-col items-center justify-center"
      style={{ height }}
    >
      {/* Wireframe cube animation */}
      <motion.div
        className="w-16 h-16 border-2 border-gray-300 rounded-lg mb-4"
        animate={{
          rotateY: [0, 360],
          borderColor: ['#d1d5db', '#9ca3af', '#d1d5db'],
        }}
        transition={{
          rotateY: { duration: 3, repeat: Infinity, ease: 'linear' },
          borderColor: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{ perspective: '200px', transformStyle: 'preserve-3d' }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-gray-400 text-xs font-light">3D</span>
        </div>
      </motion.div>
      <div aria-live="polite">
        <p className="text-sm text-gray-500">
          {elapsed >= 10 ? `${message.replace('...', '')} (${elapsed}초 경과)` : message}
        </p>
      </div>
      <div className="mt-3 w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gray-400 rounded-full"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: '50%' }}
        />
      </div>
    </div>
  )
}
