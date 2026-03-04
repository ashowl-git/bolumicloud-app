'use client'

import { BarChart3, List, Clock, Crosshair } from 'lucide-react'
import type { SunlightAnalysisResult, MeasurementPointGroup } from '@/lib/types/sunlight'

import WorkspacePanelSection from '../Workspace/WorkspacePanelSection'
import SunlightResultsTable from './SunlightResultsTable'
import SunlightComplianceSummary from './SunlightComplianceSummary'
import SunlightHourlyChart from './SunlightHourlyChart'

interface AnalysisResultsSectionProps {
  results: SunlightAnalysisResult
  selectedPointId?: string | null
  onPointSelect?: (id: string) => void
  groups?: MeasurementPointGroup[]
}

export default function AnalysisResultsSection({
  results,
  selectedPointId,
  onPointSelect,
  groups,
}: AnalysisResultsSectionProps) {
  const selectedPoint = selectedPointId
    ? results.points.find((p) => p.id === selectedPointId) ?? null
    : null

  return (
    <>
      <WorkspacePanelSection title="결과 요약" icon={<BarChart3 size={14} />}>
        <SunlightComplianceSummary summary={results.summary} />
      </WorkspacePanelSection>

      <WorkspacePanelSection title="결과 테이블" icon={<List size={14} />} defaultOpen={false}>
        <div className="max-h-60 overflow-y-auto">
          <SunlightResultsTable
            points={results.points}
            selectedPointId={selectedPointId}
            onPointSelect={onPointSelect}
            groups={groups}
          />
        </div>
      </WorkspacePanelSection>

      <WorkspacePanelSection title="시간별 차트" icon={<Clock size={14} />} defaultOpen={false}>
        {selectedPoint ? (
          <SunlightHourlyChart
            point={selectedPoint}
            timeStart={results.time_window.start}
            stepMinutes={results.time_window.step_minutes}
          />
        ) : (
          <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
            <Crosshair size={14} className="text-gray-300" />
            결과 테이블에서 측정점을 선택하세요
          </div>
        )}
      </WorkspacePanelSection>
    </>
  )
}
