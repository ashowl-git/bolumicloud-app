import { useState, useRef, useEffect, useCallback } from 'react'
import type { AnalysisResponse } from '@/lib/types/glare'
import { logger } from '@/lib/logger'

interface UseGlareAnalysisOptions {
  apiUrl: string
}

interface UseGlareAnalysisReturn {
  files: FileList | null
  uploading: boolean
  analyzing: boolean
  progress: number
  currentFile: string
  results: AnalysisResponse | null
  error: string | null
  selectedFile: string

  handleFilesSelected: (files: FileList) => void
  handleAnalyze: () => Promise<void>
  setSelectedFile: (file: string) => void
  clearError: () => void
}

export function useGlareAnalysis({ apiUrl }: UseGlareAnalysisOptions): UseGlareAnalysisReturn {
  const [files, setFiles] = useState<FileList | null>(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState('')
  const [results, setResults] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string>('')

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const errorCountRef = useRef(0)

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [])

  const handleFilesSelected = useCallback((selectedFiles: FileList) => {
    setFiles(selectedFiles)
    setError(null)
    setResults(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!files || files.length === 0) {
      setError('파일을 먼저 선택해주세요')
      return
    }

    try {
      await fetch(`${apiUrl}/glare/clear`, { method: 'DELETE' })
    } catch (e) {
      logger.warn('Clear failed', { error: e })
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('files', file)
      })

      const uploadResponse = await fetch(`${apiUrl}/glare/upload`, {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('파일 업로드 실패')
      }

      const uploadData = await uploadResponse.json()
      logger.debug('Upload success', uploadData)

      setUploading(false)

      setAnalyzing(true)
      setProgress(0)
      setCurrentFile('분석 시작 중...')

      const startRes = await fetch(`${apiUrl}/glare/analyze-async`, { method: 'POST' })
      if (!startRes.ok) {
        throw new Error('분석 시작 실패')
      }

      errorCountRef.current = 0

      progressIntervalRef.current = setInterval(async () => {
        try {
          const progressRes = await fetch(`${apiUrl}/glare/progress`)
          const progressData = await progressRes.json()

          errorCountRef.current = 0

          if (progressData.total > 0) {
            const percent = Math.round((progressData.completed / progressData.total) * 100)
            setProgress(percent)
            setCurrentFile(`${progressData.completed}/${progressData.total} 파일 처리 중...`)
          }

          if (progressData.status === 'completed') {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current)
              progressIntervalRef.current = null
            }

            const resultsRes = await fetch(`${apiUrl}/glare/results`)
            if (resultsRes.ok) {
              const analyzeData: AnalysisResponse = await resultsRes.json()
              setResults(analyzeData)
              setProgress(100)
              setCurrentFile('분석 완료!')
              setAnalyzing(false)

              if (analyzeData.results.length > 0) {
                setSelectedFile(analyzeData.results[0].file)
              }

              setTimeout(() => {
                const resultsSection = document.getElementById('results-section')
                resultsSection?.scrollIntoView({ behavior: 'smooth' })
              }, 500)
            } else {
              setError('결과를 가져올 수 없습니다')
              setAnalyzing(false)
            }
          } else if (progressData.status === 'error') {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current)
              progressIntervalRef.current = null
            }
            setError(progressData.error || '분석 중 오류 발생')
            setAnalyzing(false)
          }
        } catch (e) {
          errorCountRef.current += 1
          logger.error('Progress fetch error', { error: e, count: errorCountRef.current })

          if (errorCountRef.current >= 3) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current)
              progressIntervalRef.current = null
            }
            setError('백엔드 서버 연결 실패 (3회 연속 에러)')
            setAnalyzing(false)
          }
        }
      }, 1000)

    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
      logger.error('Analysis error', err instanceof Error ? err : undefined)
      setUploading(false)
      setAnalyzing(false)
    }
  }, [files, apiUrl])

  return {
    files,
    uploading,
    analyzing,
    progress,
    currentFile,
    results,
    error,
    selectedFile,
    handleFilesSelected,
    handleAnalyze,
    setSelectedFile,
    clearError,
  }
}
