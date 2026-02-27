'use client'

import { motion } from 'framer-motion'
import { useApi } from '@/contexts/ApiContext'
import { useGlareAnalysisContext } from '@/contexts/GlareAnalysisContext'
import FileUpload from '@/components/GlareAnalysis/FileUpload'
import ProgressBar from '@/components/GlareAnalysis/ProgressBar'
import ResultsChart from '@/components/GlareAnalysis/ResultsChart'
import ResultsTable from '@/components/GlareAnalysis/ResultsTable'
import FalsecolorViewer from '@/components/GlareAnalysis/FalsecolorViewer'
import HDRPreview from '@/components/GlareAnalysis/HDRPreview'
import FileGallery from '@/components/BoLumiCloud/FileGallery'

/**
 * 현휘 분석 탭 컴포넌트 (Context 사용 버전)
 *
 * Props drilling 제거:
 * - Before: 15개 props (apiUrl + 8 상태 + 6 액션)
 * - After: 0개 props (모두 Context에서 접근)
 *
 * Context 사용:
 * - useApi(): apiUrl
 * - useGlareAnalysisContext(): 모든 상태와 액션
 */
export default function GlareAnalysisTab() {
  // Context에서 모든 상태와 액션 가져오기
  const { apiUrl } = useApi()
  const {
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
    handleExcelDownload,
  } = useGlareAnalysisContext()

  return (
    <div className="space-y-12">
      {/* 1. 파일 입력 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-normal text-gray-900 mb-6">
          1. 파일 입력
        </h2>

        <FileUpload
          onFilesSelected={handleFilesSelected}
          disabled={uploading || analyzing}
        />

        {files && files.length > 0 && !results && (
          <div className="mt-6">
            <button
              onClick={handleAnalyze}
              disabled={uploading || analyzing}
              className="border border-gray-200 hover:border-red-600/30 px-8 py-3
                text-gray-900 hover:text-red-600 transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              분석 시작
            </button>
          </div>
        )}
      </motion.div>

      {/* 2. 분석 실행 */}
      {(uploading || analyzing) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-32 z-10 bg-amber-50/95 py-6 shadow-sm"
        >
          <h2 className="text-2xl font-normal text-gray-900 mb-6">
            2. {uploading ? '파일 전송' : '분석 실행'} 중
          </h2>

          <ProgressBar
            progress={progress}
            currentFile={currentFile}
            status={uploading ? 'uploading' : 'analyzing'}
          />
        </motion.div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="sticky top-20 z-10 border border-red-200 bg-red-50 p-6 shadow-sm"
        >
          <div className="flex justify-between items-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              x
            </button>
          </div>
        </motion.div>
      )}

      {/* 3. 결과 요약 */}
      {results && (
        <motion.div
          id="results-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-normal text-gray-900">
              3. 분석 결과 요약
            </h2>

            <button
              onClick={handleExcelDownload}
              className="border border-gray-200 hover:border-red-600/30 px-4 py-2
                text-gray-900 hover:text-red-600 transition-all duration-300
                flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel 다운로드
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="border border-gray-200 p-6">
              <p className="text-sm text-gray-800 mb-2">총 파일 수</p>
              <p className="text-4xl font-light text-gray-900">
                {results.summary.total}
              </p>
            </div>

            <div className="border border-gray-200 p-6">
              <p className="text-sm text-gray-800 mb-2">불능현휘</p>
              <p className="text-4xl font-light text-red-600">
                {results.summary.disability_count}
              </p>
              <p className="text-xs text-gray-800 mt-2">
                {((results.summary.disability_count / results.summary.total) * 100).toFixed(1)}%
              </p>
            </div>

            <div className="border border-gray-200 p-6">
              <p className="text-sm text-gray-800 mb-2">평균 DGP</p>
              <p className="text-4xl font-light text-gray-900">
                {results.summary.average_dgp.toFixed(3)}
              </p>
              <p className="text-xs text-gray-800 mt-2">
                최대: {results.summary.max_dgp.toFixed(3)}
              </p>
            </div>

            <div className="border border-gray-200 p-6">
              <p className="text-sm text-gray-800 mb-2">평균 휘도</p>
              <p className="text-4xl font-light text-gray-900">
                {results.summary.average_luminance.toFixed(0)}
              </p>
              <p className="text-xs text-gray-800 mt-2">cd/m2</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* 4. 시각화 */}
      {results && results.results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-normal text-gray-900 mb-6">
            4. 시각화
          </h2>

          <FileGallery
            results={results.results}
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
          />

          <div className="mt-6">
            <a
              href={`${apiUrl}/glare/download-all-falsecolor`}
              className="border border-gray-200 hover:border-red-600/30 px-6 py-3
                text-gray-900 hover:text-red-600 transition-all duration-300
                inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Falsecolor 전체 다운로드 (ZIP)
            </a>
          </div>

          {selectedFile && (
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <FalsecolorViewer filename={selectedFile} apiUrl={apiUrl} />
              <HDRPreview filename={selectedFile} apiUrl={apiUrl} />
            </div>
          )}
        </motion.div>
      )}

      {/* 5. 통계 그래프 */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-normal text-gray-900 mb-6">
            5. 통계
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <ResultsChart results={results.results} chartType="time" />
            <ResultsChart results={results.results} chartType="month" />
          </div>

          <ResultsChart results={results.results} chartType="viewpoint" />
        </motion.div>
      )}

      {/* 6. 상세 데이터 */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-normal text-gray-900 mb-6">
            6. 데이터
          </h2>

          <ResultsTable results={results.results} />
        </motion.div>
      )}
    </div>
  )
}
