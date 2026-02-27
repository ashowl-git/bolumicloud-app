'use client'

import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react'
import { useApi } from './ApiContext'
import { useGlareAnalysis as useGlareAnalysisHook } from '@/components/BoLumiCloud/hooks/useGlareAnalysis'
import { downloadGlareExcel } from '@/components/BoLumiCloud/utils/excelExport'
import type { AnalysisResponse } from '@/lib/types/glare'

interface GlareAnalysisContextType {
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
  handleExcelDownload: () => Promise<void>
}

const GlareAnalysisContext = createContext<GlareAnalysisContextType | null>(null)

interface GlareAnalysisProviderProps {
  children: ReactNode
}

export function GlareAnalysisProvider({ children }: GlareAnalysisProviderProps) {
  const { apiUrl } = useApi()
  const glareAnalysis = useGlareAnalysisHook({ apiUrl })

  const handleExcelDownload = useCallback(async () => {
    if (!glareAnalysis.results) return
    await downloadGlareExcel(glareAnalysis.results)
  }, [glareAnalysis.results])

  const value = useMemo<GlareAnalysisContextType>(
    () => ({
      files: glareAnalysis.files,
      uploading: glareAnalysis.uploading,
      analyzing: glareAnalysis.analyzing,
      progress: glareAnalysis.progress,
      currentFile: glareAnalysis.currentFile,
      results: glareAnalysis.results,
      error: glareAnalysis.error,
      selectedFile: glareAnalysis.selectedFile,

      handleFilesSelected: glareAnalysis.handleFilesSelected,
      handleAnalyze: glareAnalysis.handleAnalyze,
      setSelectedFile: glareAnalysis.setSelectedFile,
      clearError: glareAnalysis.clearError,
      handleExcelDownload,
    }),
    [
      glareAnalysis.files,
      glareAnalysis.uploading,
      glareAnalysis.analyzing,
      glareAnalysis.progress,
      glareAnalysis.currentFile,
      glareAnalysis.results,
      glareAnalysis.error,
      glareAnalysis.selectedFile,
      glareAnalysis.handleFilesSelected,
      glareAnalysis.handleAnalyze,
      glareAnalysis.setSelectedFile,
      glareAnalysis.clearError,
      handleExcelDownload,
    ]
  )

  return (
    <GlareAnalysisContext.Provider value={value}>
      {children}
    </GlareAnalysisContext.Provider>
  )
}

export function useGlareAnalysisContext(): GlareAnalysisContextType {
  const context = useContext(GlareAnalysisContext)

  if (!context) {
    throw new Error('useGlareAnalysisContext must be used within a GlareAnalysisProvider')
  }

  return context
}
