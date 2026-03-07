'use client'

import { Grid3X3, Sun } from 'lucide-react'
import type {
  SunlightConfigState,
  SunlightAnalysisResult,
  CauseAnalysisResult,
  LayerConfig,
  MeasurementPointGroup,
} from '@/lib/types/sunlight'
import type { BaseAnalysisPoint } from '@/components/shared/3d/interaction/types'
import type { BatchPointParams } from './hooks/usePointGroups'
import type { useSolarChart3D } from '@/hooks/useSolarChart3D'

import WorkspaceSidePanel from '../WorkspaceSidePanel'
import WorkspacePanelSection from '../WorkspacePanelSection'
import LayerPanel from './LayerPanel'

import LocationConfigSection from '@/components/SunlightAnalysis/LocationConfigSection'
import DateTimeConfigSection from '@/components/SunlightAnalysis/DateTimeConfigSection'
import PointGroupManager from '@/components/SunlightAnalysis/PointGroupManager'
import AnalysisControlSection from '@/components/SunlightAnalysis/AnalysisControlSection'
import AnalysisResultsSection from '@/components/SunlightAnalysis/AnalysisResultsSection'
import ReportSection from '@/components/SunlightAnalysis/ReportSection'
import CauseAnalysisSection from '@/components/SunlightAnalysis/CauseAnalysisSection'
import GroundAnalysisSection from '@/components/SunlightAnalysis/GroundAnalysisSection'
import SolarDiagram3DSection from '@/components/SunlightAnalysis/SolarDiagram3DSection'

// ─── Props ─────────────────────────────────────
interface SunlightSidePanelProps {
  open: boolean
  onClose: () => void
  onOpen: () => void
  // Config
  config: SunlightConfigState
  onConfigChange: (partial: Partial<SunlightConfigState>) => void
  disabled?: boolean
  // Points
  points: BaseAnalysisPoint[]
  selectedPointId?: string | null
  onPointSelect?: (id: string) => void
  // Point Groups
  groups: MeasurementPointGroup[]
  activeGroupId: string | null
  onAddGroup: (name: string) => void
  onRemoveGroup: (groupId: string) => void
  onRenameGroup: (groupId: string, name: string) => void
  onSetActiveGroup: (groupId: string) => void
  onSortGroup: (groupId: string) => void
  onToggleReverseColumns: (groupId: string) => void
  onBatchCreate?: (params: BatchPointParams) => void
  // Analysis
  isRunning: boolean
  onStartAnalysis: () => void
  // Results
  results: SunlightAnalysisResult | null
  // Report
  onGenerateReport?: () => void
  reportDownloadUrl?: string | null
  isGeneratingReport?: boolean
  // Cause analysis
  causeResult: CauseAnalysisResult | null
  selectedBuildingId: string | null
  onBuildingSelect: (id: string | null) => void
  // Ground analysis
  gridInterval?: number
  onGridIntervalChange?: (interval: number) => void
  onStartGroundAnalysis?: () => void
  isGroundAnalysisRunning?: boolean
  // Optimization
  sessionId?: string | null
  // Layer management
  layers?: LayerConfig[]
  onToggleLayerVisibility?: (layerId: string) => void
  onToggleAnalysisTarget?: (layerId: string) => void
  onToggleAllLayers?: (visible: boolean) => void
  // Solar chart 3D
  solarChart?: ReturnType<typeof useSolarChart3D>
}

export default function SunlightSidePanel({
  open,
  onClose,
  onOpen,
  config,
  onConfigChange,
  disabled,
  points,
  selectedPointId,
  onPointSelect,
  groups,
  activeGroupId,
  onAddGroup,
  onRemoveGroup,
  onRenameGroup,
  onSetActiveGroup,
  onSortGroup,
  onToggleReverseColumns,
  onBatchCreate,
  isRunning,
  onStartAnalysis,
  results,
  onGenerateReport,
  reportDownloadUrl,
  isGeneratingReport,
  causeResult,
  selectedBuildingId,
  onBuildingSelect,
  gridInterval = 2.0,
  onGridIntervalChange,
  onStartGroundAnalysis,
  isGroundAnalysisRunning = false,
  sessionId = null,
  layers = [],
  onToggleLayerVisibility,
  onToggleAnalysisTarget,
  onToggleAllLayers,
  solarChart,
}: SunlightSidePanelProps) {
  const noPoints = points.length === 0

  const footer = (
    <AnalysisControlSection
      isRunning={isRunning}
      onStartAnalysis={onStartAnalysis}
      results={results}
      disabled={disabled}
      noPoints={noPoints}
    />
  )

  return (
    <WorkspaceSidePanel
      title="일조 분석"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      footer={footer}
    >
      {/* ── 위치 설정 ── */}
      <LocationConfigSection
        config={config}
        onConfigChange={onConfigChange}
        disabled={disabled}
      />

      {/* ── 날짜/해상도 ── */}
      <DateTimeConfigSection
        config={config}
        onConfigChange={onConfigChange}
        disabled={disabled}
      />

      {/* ── 레이어 관리 ── */}
      {layers.length > 0 && (
        <WorkspacePanelSection
          title="레이어"
          icon={<Grid3X3 size={14} />}
          badge={layers.length}
          defaultOpen={true}
        >
          <LayerPanel
            layers={layers}
            onToggleVisibility={onToggleLayerVisibility || (() => {})}
            onToggleAnalysisTarget={onToggleAnalysisTarget || (() => {})}
            onToggleAll={onToggleAllLayers}
          />
        </WorkspacePanelSection>
      )}

      {/* ── 측정점 그룹 ── */}
      <PointGroupManager
        points={points}
        selectedPointId={selectedPointId}
        onPointSelect={onPointSelect}
        groups={groups}
        activeGroupId={activeGroupId}
        onAddGroup={onAddGroup}
        onRemoveGroup={onRemoveGroup}
        onRenameGroup={onRenameGroup}
        onSetActiveGroup={onSetActiveGroup}
        onSortGroup={onSortGroup}
        onToggleReverseColumns={onToggleReverseColumns}
        onBatchCreate={onBatchCreate}
        disabled={disabled}
      />

      {/* ── 결과 (분석 완료 후) ── */}
      {results && (
        <>
          <AnalysisResultsSection
            results={results}
            selectedPointId={selectedPointId}
            onPointSelect={onPointSelect}
            groups={groups}
          />

          <ReportSection
            onGenerateReport={onGenerateReport}
            reportDownloadUrl={reportDownloadUrl}
            isGeneratingReport={isGeneratingReport}
          />

          <CauseAnalysisSection
            causeResult={causeResult}
            selectedBuildingId={selectedBuildingId}
            onBuildingSelect={onBuildingSelect}
            points={points}
            config={config}
            sessionId={sessionId}
          />

          <GroundAnalysisSection
            gridInterval={gridInterval}
            onGridIntervalChange={onGridIntervalChange}
            onStartGroundAnalysis={onStartGroundAnalysis}
            isGroundAnalysisRunning={isGroundAnalysisRunning}
            results={results}
            disabled={disabled}
          />

          <SolarDiagram3DSection
            latitude={config.latitude}
            longitude={config.longitude}
            selectedPointId={selectedPointId}
          />

          {/* 3D 일조도표 (씬 위 렌더링) */}
          {solarChart && sessionId && selectedPointId && (
            <WorkspacePanelSection
              title="3D 일조도표"
              icon={<Sun size={14} />}
              defaultOpen
            >
              <div className="space-y-2">
                <p className="text-xs text-gray-500">
                  선택된 측정점에서 태양 궤적 방향으로 팬 곡면을 렌더링하여 일조침해를 시각화합니다.
                </p>
                {solarChart.data ? (
                  <div className="space-y-2">
                    <div className="text-xs bg-gray-50 rounded p-2 space-y-1">
                      <div>총일조: <b>{solarChart.data.summary.total_hours}시간</b></div>
                      <div>연속일조: <b>{solarChart.data.summary.continuous_hours}시간</b></div>
                      {solarChart.data.sunlit_intervals.map((iv, i) => (
                        <div key={i} className="text-gray-500">{iv.label}: {iv.start}~{iv.end}</div>
                      ))}
                    </div>
                    <button
                      onClick={() => solarChart.clear()}
                      className="w-full px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                    >
                      닫기
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const pt = points.find(p => p.id === selectedPointId)
                      if (!pt || !sessionId) return
                      solarChart.compute({
                        session_id: sessionId,
                        point: [pt.position.x, pt.position.y, pt.position.z],
                        point_normal: pt.normal ? [pt.normal.dx, pt.normal.dy, pt.normal.dz] : null,
                        latitude: config.latitude,
                        longitude: config.longitude,
                        timezone_offset: config.timezone / 15,
                        month: config.date.month,
                        day: config.date.day,
                      })
                    }}
                    disabled={solarChart.isLoading}
                    className="w-full px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors disabled:opacity-50"
                  >
                    {solarChart.isLoading ? '계산 중...' : '일조도표 생성'}
                  </button>
                )}
                {solarChart.error && (
                  <p className="text-xs text-red-500">{solarChart.error}</p>
                )}
              </div>
            </WorkspacePanelSection>
          )}
        </>
      )}
    </WorkspaceSidePanel>
  )
}
