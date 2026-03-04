'use client'

import { Grid3X3 } from 'lucide-react'
import type {
  SunlightConfigState,
  SunlightAnalysisResult,
  CauseAnalysisResult,
  LayerConfig,
} from '@/lib/types/sunlight'
import type { BaseAnalysisPoint } from '@/components/shared/3d/interaction/types'
import type { MeasurementPointGroup } from '@/lib/types/sunlight'

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
          defaultOpen={false}
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
        disabled={disabled}
      />

      {/* ── 결과 (분석 완료 후) ── */}
      {results && (
        <>
          <AnalysisResultsSection
            results={results}
            selectedPointId={selectedPointId}
            onPointSelect={onPointSelect}
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
        </>
      )}
    </WorkspaceSidePanel>
  )
}
