'use client'

import { useState, forwardRef } from 'react'
import { motion } from 'framer-motion'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { Images, AlertTriangle, Gauge, Sun } from 'lucide-react'
import PipelineImageGallery from '@/components/Pipeline/PipelineImageGallery'
import PipelineImageViewer from '@/components/Pipeline/PipelineImageViewer'
import PipelineDownloads from '@/components/Pipeline/PipelineDownloads'
import ResultsChart from '@/components/GlareAnalysis/ResultsChart'
import ResultsTable from '@/components/GlareAnalysis/ResultsTable'
import type { GlareResult, AnalysisResponse } from '@/lib/types/glare'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  reset: { ko: '새로 시작', en: 'Reset' } as LocalizedText,
  changeSettings: { ko: '설정 변경', en: 'Change Settings' } as LocalizedText,
}

const fadeVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

interface ResultsStepProps {
  results: AnalysisResponse
  apiUrl: string
  sessionId: string
  onBackToSettings: () => void
  onReset: () => void
}

type ResultsTab = 'summary' | 'chart' | 'gallery' | 'data' | 'download'

const ResultsStep = forwardRef<HTMLDivElement, ResultsStepProps>(function ResultsStep({
  results,
  apiUrl,
  sessionId,
  onBackToSettings,
  onReset,
}, ref) {
  const { t } = useLocalizedText()
  const [resultsTab, setResultsTab] = useState<ResultsTab>('summary')
  const [viewerResult, setViewerResult] = useState<GlareResult | null>(null)

  const hasMultipleViewpoints = new Set(
    results.results.map((r) => r.viewp).filter(Boolean)
  ).size > 1
  const hasMultipleDates = new Set(
    results.results.map((r) => r.date_label).filter(Boolean)
  ).size > 1

  const info = (results as unknown as Record<string, unknown>).pipeline_info as
    | { total_duration_sec: number; quality: string; resolution: string; renders: number; vf_count?: number; date_count?: number }
    | undefined

  return (
    <motion.div
      key="step-5"
      ref={ref}
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Pipeline Info */}
      {info && (
        <div className="border border-gray-200 p-4">
          <p className="text-sm text-gray-700">
            총 소요 시간 {(info.total_duration_sec / 60).toFixed(1)}min |{' '}
            {info.quality} | {info.resolution} |{' '}
            {info.vf_count && info.vf_count > 1 ? `${info.vf_count} VFs | ` : ''}
            {info.date_count && info.date_count > 1 ? `${info.date_count} dates | ` : ''}
            렌더 수 {info.renders}
          </p>
        </div>
      )}

      {/* Results Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {([
            { id: 'summary', label: '요약' },
            { id: 'chart', label: '차트' },
            { id: 'gallery', label: '갤러리' },
            { id: 'data', label: '데이터' },
            { id: 'download', label: '다운로드' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setResultsTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-300 ${
                resultsTab === tab.id
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Tab Content */}
      {resultsTab === 'summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Images size={16} strokeWidth={1.5} className="text-gray-400" />
                <p className="text-sm text-gray-800">총 렌더</p>
              </div>
              <p className="text-4xl font-light text-gray-900">
                {results.summary.total}
              </p>
            </div>

            <div className={`border p-6 ${
              results.summary.disability_count > 0
                ? 'border-red-200 bg-red-50'
                : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} strokeWidth={1.5} className={
                  results.summary.disability_count > 0 ? 'text-red-500' : 'text-gray-400'
                } />
                <p className="text-sm text-gray-800">불능현휘</p>
              </div>
              <p className="text-4xl font-light text-red-600">
                {results.summary.disability_count}
              </p>
              <p className="text-xs text-gray-800 mt-2">
                {results.summary.total > 0
                  ? ((results.summary.disability_count / results.summary.total) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </div>

            <div className="border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Gauge size={16} strokeWidth={1.5} className="text-gray-400" />
                <p className="text-sm text-gray-800">평균 DGP</p>
              </div>
              <p className="text-4xl font-light text-gray-900">
                {Number(results.summary.average_dgp).toFixed(3)}
              </p>
              <p className="text-xs text-gray-800 mt-2">
                최대: {Number(results.summary.max_dgp).toFixed(3)}
              </p>
            </div>

            <div className="border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Sun size={16} strokeWidth={1.5} className="text-gray-400" />
                <p className="text-sm text-gray-800">평균 휘도</p>
              </div>
              <p className="text-4xl font-light text-gray-900">
                {Number(results.summary.average_luminance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-800 mt-2">cd/m2</p>
            </div>
          </div>
        </div>
      )}

      {resultsTab === 'chart' && results.results.length > 0 && (
        <div className="space-y-6">
          {hasMultipleViewpoints && (
            <ResultsChart results={results.results} chartType="heatmap" />
          )}
          {hasMultipleDates && (
            <ResultsChart results={results.results} chartType="date_comparison" />
          )}
          <ResultsChart results={results.results} chartType="dgp_distribution" />
          <div className="grid md:grid-cols-2 gap-6">
            <ResultsChart results={results.results} chartType="time" />
            {hasMultipleViewpoints && (
              <ResultsChart results={results.results} chartType="viewpoint" />
            )}
          </div>
        </div>
      )}

      {resultsTab === 'gallery' && results.results.length > 0 && (
        <PipelineImageGallery
          results={results.results}
          apiUrl={apiUrl}
          sessionId={sessionId}
          onImageClick={(r) => setViewerResult(r)}
        />
      )}

      {resultsTab === 'data' && results.results.length > 0 && (
        <ResultsTable results={results.results} />
      )}

      {resultsTab === 'download' && (
        <PipelineDownloads apiUrl={apiUrl} sessionId={sessionId} />
      )}

      {/* Bottom Navigation */}
      <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
        <button
          onClick={onBackToSettings}
          className="border border-gray-200 hover:border-gray-400 px-6 py-3
            text-sm text-gray-700 hover:text-gray-900 transition-all duration-300"
        >
          {t(txt.changeSettings)}
        </button>
        <button
          onClick={onReset}
          className="border border-gray-200 hover:border-red-600/30 px-6 py-3
            text-sm text-gray-900 hover:text-red-600 transition-all duration-300"
        >
          {t(txt.reset)}
        </button>
      </div>

      {/* Image Viewer Modal */}
      {viewerResult && (
        <PipelineImageViewer
          result={viewerResult}
          apiUrl={apiUrl}
          sessionId={sessionId}
          onClose={() => setViewerResult(null)}
        />
      )}
    </motion.div>
  )
})

export default ResultsStep
