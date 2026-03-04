'use client'

import { Search, Sparkles } from 'lucide-react'
import type { CauseAnalysisResult, SunlightConfigState } from '@/lib/types/sunlight'
import type { BaseAnalysisPoint } from '@/components/shared/3d/interaction/types'

import WorkspacePanelSection from '../Workspace/WorkspacePanelSection'
import CauseAnalysisView from './CauseAnalysisView'
import OptimizationPanel from './OptimizationPanel'

interface CauseAnalysisSectionProps {
  causeResult: CauseAnalysisResult | null
  selectedBuildingId: string | null
  onBuildingSelect: (id: string | null) => void
  points: BaseAnalysisPoint[]
  config: SunlightConfigState
  sessionId?: string | null
}

export default function CauseAnalysisSection({
  causeResult,
  selectedBuildingId,
  onBuildingSelect,
  points,
  config,
  sessionId = null,
}: CauseAnalysisSectionProps) {
  if (!causeResult || causeResult.total_non_compliant <= 0) return null

  return (
    <>
      <WorkspacePanelSection title="원인 분석" icon={<Search size={14} />} defaultOpen={false}>
        <CauseAnalysisView
          causeResult={causeResult}
          selectedBuildingId={selectedBuildingId}
          onBuildingSelect={onBuildingSelect}
        />
      </WorkspacePanelSection>

      <WorkspacePanelSection title="최적안 검토" icon={<Sparkles size={14} />} defaultOpen={false}>
        <OptimizationPanel
          sessionId={sessionId}
          causeResult={causeResult}
          measurementPoints={points.map(p => ({ x: p.position.x, y: p.position.y, z: p.position.z }))}
          config={{
            latitude: config.latitude,
            longitude: config.longitude,
            timezone: config.timezone,
            date: config.date,
          }}
        />
      </WorkspacePanelSection>
    </>
  )
}
