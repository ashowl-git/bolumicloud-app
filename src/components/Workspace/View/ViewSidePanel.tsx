'use client'

import { MapPin, Eye, List, BarChart3, FileSpreadsheet } from 'lucide-react'
import { CITY_PRESETS } from '@/lib/types/pipeline'
import {
  HEMISPHERE_RESOLUTION_LABELS,
  PROJECTION_TYPE_LABELS,
} from '@/lib/types/view'
import type {
  ViewConfigState,
  ViewAnalysisResult,
  HemisphereResolution,
  ProjectionType,
} from '@/lib/types/view'
import type { BaseAnalysisPoint } from '@/components/shared/3d/interaction/types'

import WorkspaceSidePanel from '../WorkspaceSidePanel'
import WorkspacePanelSection from '../WorkspacePanelSection'
import ViewResultsTable from '@/components/ViewAnalysis/ViewResultsTable'
import ViewSummary from '@/components/ViewAnalysis/ViewSummary'

interface ViewSidePanelProps {
  open: boolean
  onClose: () => void
  onOpen: () => void
  config: ViewConfigState
  onConfigChange: (partial: Partial<ViewConfigState>) => void
  disabled?: boolean
  points: BaseAnalysisPoint[]
  selectedPointId?: string | null
  onPointSelect?: (id: string) => void
  isRunning: boolean
  onStartAnalysis: () => void
  results: ViewAnalysisResult | null
  onGenerateReport?: () => void
  reportDownloadUrl?: string | null
  isGeneratingReport?: boolean
}

function getTimezone(lon: number): number {
  return Math.round(lon / 15) * 15
}

export default function ViewSidePanel({
  open,
  onClose,
  onOpen,
  config,
  onConfigChange,
  disabled,
  points,
  selectedPointId,
  onPointSelect,
  isRunning,
  onStartAnalysis,
  results,
  onGenerateReport,
  reportDownloadUrl,
  isGeneratingReport,
}: ViewSidePanelProps) {
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
      title="조망 분석"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      footer={!results ? footer : undefined}
    >
      {/* ── 위치 설정 ── */}
      <WorkspacePanelSection title="위치" icon={<MapPin size={14} />}>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {CITY_PRESETS.map((city, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onConfigChange({
                latitude: city.latitude,
                longitude: city.longitude,
                timezone: getTimezone(city.longitude),
              })}
              disabled={disabled}
              className="border border-gray-200 hover:border-red-600/30 px-2 py-1
                text-xs text-gray-700 hover:text-red-600 transition-all disabled:opacity-50"
            >
              {city.name.ko}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">위도</label>
            <input
              type="number" step="0.001" value={config.latitude}
              onChange={(e) => onConfigChange({ latitude: Number(e.target.value) })}
              disabled={disabled}
              className="w-full border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-600/30 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">경도</label>
            <input
              type="number" step="0.001" value={config.longitude}
              onChange={(e) => onConfigChange({ longitude: Number(e.target.value) })}
              disabled={disabled}
              className="w-full border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-600/30 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">자오선</label>
            <input
              type="number" step="1" value={config.timezone}
              onChange={(e) => onConfigChange({ timezone: Number(e.target.value) })}
              disabled={disabled}
              className="w-full border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:border-red-600/30 disabled:opacity-50"
            />
          </div>
        </div>
      </WorkspacePanelSection>

      {/* ── 반구 해상도/투영 ── */}
      <WorkspacePanelSection title="반구 설정" icon={<Eye size={14} />}>
        <div className="mb-3">
          <label className="text-[10px] text-gray-500 block mb-1">반구 해상도</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.entries(HEMISPHERE_RESOLUTION_LABELS) as [string, { ko: string; description: string }][]).map(
              ([value, info]) => {
                const res = Number(value) as HemisphereResolution
                const isSelected = config.hemisphereResolution === res
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onConfigChange({ hemisphereResolution: res })}
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
                    <p className="text-[10px] text-gray-500 mt-0.5">{info.description}</p>
                  </button>
                )
              }
            )}
          </div>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">투영 방식</label>
          <div className="flex gap-1.5">
            {(Object.entries(PROJECTION_TYPE_LABELS) as [ProjectionType, { ko: string }][]).map(
              ([value, label]) => {
                const isSelected = config.projectionType === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onConfigChange({ projectionType: value })}
                    disabled={disabled}
                    className={`flex-1 py-2 text-xs text-center transition-all rounded disabled:opacity-50 ${
                      isSelected
                        ? 'border border-red-600 bg-red-50 text-red-600 font-medium'
                        : 'border border-gray-200 text-gray-700 hover:border-red-600/30 hover:bg-gray-50/50'
                    }`}
                  >
                    {label.ko}
                  </button>
                )
              }
            )}
          </div>
        </div>
      </WorkspacePanelSection>

      {/* ── 관찰점 목록 ── */}
      <WorkspacePanelSection title="관찰점" icon={<List size={14} />} badge={points.length} defaultOpen={points.length > 0}>
        {points.length === 0 ? (
          <div className="py-3 text-center">
            <p className="text-xs text-gray-500">벽면 또는 지붕을 클릭하여 관찰점을 배치하세요</p>
            <p className="text-[10px] text-gray-300 mt-1">도구 모음에서 배치 모드(P)를 선택한 후 클릭</p>
          </div>
        ) : (
          <div className="max-h-40 overflow-y-auto space-y-1">
            {points.map((pt) => {
              const isWall = pt.surfaceType === 'wall'
              return (
                <button
                  key={pt.id}
                  onClick={() => onPointSelect?.(pt.id)}
                  className={`w-full text-left px-2 py-1.5 text-xs transition-colors rounded flex items-center justify-between ${
                    selectedPointId === pt.id ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{pt.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    isWall
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-sky-50 text-sky-600'
                  }`}>
                    {pt.surfaceType === 'wall' ? '벽면' : '지붕'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </WorkspacePanelSection>

      {/* ── 결과 ── */}
      {results && (
        <>
          <WorkspacePanelSection title="결과 요약 (SVF)" icon={<BarChart3 size={14} />}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-gray-400">높음</span>
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-gray-400">중간</span>
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-gray-400">낮음</span>
              </div>
            </div>
            <ViewSummary summary={results.summary} />
          </WorkspacePanelSection>

          <WorkspacePanelSection title="결과 테이블" icon={<List size={14} />} defaultOpen={false}>
            <div className="max-h-60 overflow-y-auto">
              <ViewResultsTable
                observers={results.observers}
                selectedObserverId={selectedPointId}
                onObserverSelect={onPointSelect}
              />
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
