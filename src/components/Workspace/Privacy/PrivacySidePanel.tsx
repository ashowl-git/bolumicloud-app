'use client'

import { Ruler, List, BarChart3, FileSpreadsheet } from 'lucide-react'
import { SUB_GRID_LABELS } from '@/lib/types/privacy'
import type {
  PrivacyConfigState,
  PrivacyAnalysisResult,
  SubGridResolution,
} from '@/lib/types/privacy'

import WorkspaceSidePanel from '../WorkspaceSidePanel'
import WorkspacePanelSection from '../WorkspacePanelSection'
import PrivacyResultsTable from '@/components/PrivacyAnalysis/PrivacyResultsTable'
import PrivacySummary from '@/components/PrivacyAnalysis/PrivacySummary'

interface PrivacySidePanelProps {
  open: boolean
  onClose: () => void
  onOpen: () => void
  config: PrivacyConfigState
  onConfigChange: (partial: Partial<PrivacyConfigState>) => void
  disabled?: boolean
  activeRole: 'target' | 'observer'
  isRunning: boolean
  onStartAnalysis: () => void
  results: PrivacyAnalysisResult | null
  onGenerateReport?: () => void
  reportDownloadUrl?: string | null
  isGeneratingReport?: boolean
}

export default function PrivacySidePanel({
  open,
  onClose,
  onOpen,
  config,
  onConfigChange,
  disabled,
  activeRole,
  isRunning,
  onStartAnalysis,
  results,
  onGenerateReport,
  reportDownloadUrl,
  isGeneratingReport,
}: PrivacySidePanelProps) {
  const footer = (
    <button
      onClick={onStartAnalysis}
      disabled={isRunning || disabled}
      className="w-full border border-gray-200 hover:border-red-600/30 py-2.5
        text-sm text-gray-900 hover:text-red-600 transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isRunning ? '분석 중...' : '분석 시작'}
    </button>
  )

  return (
    <WorkspaceSidePanel
      title="사생활 분석"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      footer={!results ? footer : undefined}
    >
      {/* ── 분석 파라미터 ── */}
      <WorkspacePanelSection title="분석 파라미터" icon={<Ruler size={14} />}>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-gray-400 block mb-0.5">거리 임계값 (m)</label>
            <input
              type="number" step="10" min="10" max="500"
              value={config.distanceThreshold}
              onChange={(e) => onConfigChange({ distanceThreshold: Number(e.target.value) })}
              disabled={disabled}
              className="w-full border border-gray-200 px-2 py-1 text-xs
                focus:outline-none focus:border-red-600/30 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">서브그리드 해상도</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.entries(SUB_GRID_LABELS) as [string, { ko: string; description: string }][]).map(
                ([value, info]) => {
                  const res = Number(value) as SubGridResolution
                  const isSelected = config.subGridResolution === res
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onConfigChange({ subGridResolution: res })}
                      disabled={disabled}
                      className={`border p-2.5 text-left transition-all disabled:opacity-50 rounded ${
                        isSelected
                          ? 'border-red-600 bg-red-50 shadow-sm'
                          : 'border-gray-200 hover:border-red-600/30 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-medium ${isSelected ? 'text-red-600' : 'text-gray-900'}`}>{info.ko}</p>
                        <span className={`text-[10px] tabular-nums ${isSelected ? 'text-red-500' : 'text-gray-400'}`}>
                          {value}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{info.description}</p>
                    </button>
                  )
                }
              )}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-0.5">PII 임계값</label>
            <input
              type="number" step="0.0001" min="0"
              value={config.piiThreshold}
              onChange={(e) => onConfigChange({ piiThreshold: Number(e.target.value) })}
              disabled={disabled}
              className="w-full border border-gray-200 px-2 py-1 text-xs
                focus:outline-none focus:border-red-600/30 disabled:opacity-50"
            />
          </div>
        </div>
      </WorkspacePanelSection>

      {/* ── 대상 창문 (orange) ── */}
      <WorkspacePanelSection
        title="대상 창문"
        icon={<div className="w-3 h-3 bg-orange-500 rounded-sm" />}
        badge={config.targetWindows.length}
        defaultOpen={activeRole === 'target'}
      >
        {config.targetWindows.length === 0 ? (
          <div className="py-3 text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-50 border border-orange-200/60 mb-2">
              <span className="text-[10px] text-orange-600 font-medium">Step 1</span>
            </div>
            <p className="text-xs text-gray-400">
              도구 모음에서 <span className="text-orange-600 font-medium">대상</span> 역할을 선택한 후
            </p>
            <p className="text-xs text-gray-400">벽면을 클릭하여 피관찰 창문을 배치하세요</p>
          </div>
        ) : (
          <div className="max-h-32 overflow-y-auto space-y-1">
            {config.targetWindows.map((w) => (
              <div key={w.id} className="text-xs text-orange-700 px-2 py-1.5 bg-orange-50 border border-orange-100 rounded flex items-center justify-between">
                <span className="font-medium">{w.building_name} {w.floor}F</span>
                <span className="text-[10px] text-orange-500">{w.width.toFixed(1)}x{w.height.toFixed(1)}m</span>
              </div>
            ))}
          </div>
        )}
      </WorkspacePanelSection>

      {/* ── 관찰 창문 (blue) ── */}
      <WorkspacePanelSection
        title="관찰 창문"
        icon={<div className="w-3 h-3 bg-blue-500 rounded-sm" />}
        badge={config.observerWindows.length}
        defaultOpen={activeRole === 'observer'}
      >
        {config.observerWindows.length === 0 ? (
          <div className="py-3 text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 border border-blue-200/60 mb-2">
              <span className="text-[10px] text-blue-600 font-medium">Step 2</span>
            </div>
            <p className="text-xs text-gray-400">
              도구 모음에서 <span className="text-blue-600 font-medium">관찰</span> 역할로 전환한 후
            </p>
            <p className="text-xs text-gray-400">벽면을 클릭하여 관찰자 창문을 배치하세요</p>
          </div>
        ) : (
          <div className="max-h-32 overflow-y-auto space-y-1">
            {config.observerWindows.map((w) => (
              <div key={w.id} className="text-xs text-blue-700 px-2 py-1.5 bg-blue-50 border border-blue-100 rounded flex items-center justify-between">
                <span className="font-medium">{w.building_name} {w.floor}F</span>
                <span className="text-[10px] text-blue-500">{w.width.toFixed(1)}x{w.height.toFixed(1)}m</span>
              </div>
            ))}
          </div>
        )}
      </WorkspacePanelSection>

      {/* ── 결과 ── */}
      {results && (
        <>
          <WorkspacePanelSection title="결과 요약" icon={<BarChart3 size={14} />}>
            <PrivacySummary summary={results.summary} />
          </WorkspacePanelSection>

          <WorkspacePanelSection title="결과 테이블" icon={<List size={14} />} defaultOpen={false}>
            <div className="max-h-60 overflow-y-auto">
              <PrivacyResultsTable pairs={results.pairs} />
            </div>
          </WorkspacePanelSection>

          <WorkspacePanelSection title="보고서" icon={<FileSpreadsheet size={14} />} defaultOpen={false}>
            <div className="flex items-center gap-2">
              {!reportDownloadUrl && onGenerateReport && (
                <button
                  onClick={onGenerateReport}
                  disabled={isGeneratingReport}
                  className="flex items-center gap-1 border border-gray-200 hover:border-red-600/30
                    px-3 py-1.5 text-xs text-gray-900 hover:text-red-600 transition-all disabled:opacity-50"
                >
                  {isGeneratingReport ? '생성 중...' : 'Excel 보고서 생성'}
                </button>
              )}
              {reportDownloadUrl && (
                <a
                  href={reportDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 border border-green-200 hover:border-green-400
                    px-3 py-1.5 text-xs text-green-700 hover:text-green-800 transition-all"
                >
                  Excel 다운로드
                </a>
              )}
            </div>
          </WorkspacePanelSection>
        </>
      )}
    </WorkspaceSidePanel>
  )
}
