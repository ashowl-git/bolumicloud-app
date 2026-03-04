'use client'

import { useRef } from 'react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import type { LocalizedText } from '@/lib/types/i18n'
import type { SunlightConfigState, CauseAnalysisResult } from '@/lib/types/sunlight'
import type { BoundingBox } from '@/components/shared/3d/types'
import type { Group } from 'three'
import type { BaseAnalysisPoint } from '@/components/shared/3d/interaction/types'

import { FileSearch } from 'lucide-react'
import EmptyState from '@/components/common/EmptyState'
import SunlightResults from '../SunlightResults'
import SunlightLegend from '../3d/SunlightLegend'
import ShadowAnimationPlayer from '../3d/ShadowAnimationPlayer'
import ReportDownloadPanel from '../ReportDownloadPanel'
import CauseAnalysisView from '../CauseAnalysisView'
import type { UseShadowAnimationReturn } from '../hooks/useShadowAnimation'

import dynamic from 'next/dynamic'
const SunlightHeatmapOverlay = dynamic(() => import('../3d/SunlightHeatmapOverlay'), { ssr: false })
const ViolationHighlight = dynamic(() => import('../3d/ViolationHighlight'), { ssr: false })

const txt = {
  reset: { ko: '새로 시작', en: 'Reset' } as LocalizedText,
  backToSettings: { ko: '설정 변경', en: 'Change Settings' } as LocalizedText,
}

export interface ResultsStepProps {
  sessionId: string | null
  results: any
  config: SunlightConfigState
  modelScene: Group | null
  modelBbox: BoundingBox | null
  shadow: UseShadowAnimationReturn
  placementPoints: BaseAnalysisPoint[]
  selectedPointId: string | null
  onPointSelect: (id: string | null) => void
  causeResult: CauseAnalysisResult | null
  onCauseAnalysis: (result: CauseAnalysisResult | null) => void
  selectedBuildingId: string | null
  onBuildingSelect: (id: string | null) => void
  onBackToSettings: () => void
  onReset: () => void
}

export default function ResultsStep({
  sessionId,
  results,
  config,
  modelScene,
  modelBbox,
  shadow,
  placementPoints,
  selectedPointId,
  onPointSelect,
  causeResult,
  onCauseAnalysis,
  selectedBuildingId,
  onBuildingSelect,
  onBackToSettings,
  onReset,
}: ResultsStepProps) {
  const { t } = useLocalizedText()
  const resultsSectionRef = useRef<HTMLDivElement>(null)

  if (!results || !results.points || results.points.length === 0) {
    return (
      <EmptyState
        icon={FileSearch}
        title="일조 분석 결과가 없습니다"
        description="측정점이 올바르게 설정되었는지 확인하세요."
        action={{ label: '설정으로 돌아가기', onClick: onBackToSettings }}
      />
    )
  }

  return (
    <div ref={resultsSectionRef} className="space-y-6">
      {/* Shadow 3D Visualization + Heatmap */}
      {modelScene && shadow.frames.length > 0 && (
        <div className="relative">
          <ShadowAnimationPlayer
            modelScene={modelScene}
            modelBbox={modelBbox}
            currentFrame={shadow.currentFrame}
            playback={shadow.playback}
            maxMinute={shadow.frames.length > 0 ? shadow.frames[shadow.frames.length - 1].minute : 479}
            stepSize={shadow.frames.length > 1 ? shadow.frames[1].minute - shadow.frames[0].minute : 10}
            onMinuteChange={shadow.setCurrentMinute}
            onPlay={shadow.play}
            onPause={shadow.pause}
            onSpeedChange={shadow.setSpeed}
          >
            {results.points.length > 0 && (
              <SunlightHeatmapOverlay
                points={placementPoints.length > 0
                  ? placementPoints.map((p) => ({ id: p.id, x: p.position.x, y: p.position.y, z: p.position.z, name: p.name }))
                  : results.points.map((p: any) => ({ id: p.id, x: p.x, y: p.y, z: p.z, name: p.name }))
                }
                results={results.points}
                selectedPointId={selectedPointId}
                onPointClick={onPointSelect}
              />
            )}
            {causeResult && causeResult.point_causes.length > 0 && (
              <ViolationHighlight
                blockers={causeResult.point_causes.flatMap((pc) => pc.blockers)}
                selectedBuildingId={selectedBuildingId}
              />
            )}
          </ShadowAnimationPlayer>
          {results.points.length > 0 && <SunlightLegend />}
        </div>
      )}
      {shadow.isComputing && (
        <div className="border border-gray-200 p-6 text-center" aria-live="polite">
          <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">
            그림자 계산 중... {shadow.computeProgress.toFixed(0)}%
          </p>
          <div
            className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden mx-auto mt-2"
            role="progressbar"
            aria-valuenow={Math.round(shadow.computeProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Shadow computation progress"
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${shadow.computeProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Report Download (Phase 4) */}
      {sessionId && (
        <ReportDownloadPanel
          sessionId={sessionId}
          results={results}
          config={config}
          onCauseAnalysis={onCauseAnalysis}
        />
      )}

      {/* Results Table */}
      <SunlightResults
        results={results}
        selectedPointId={selectedPointId}
        onPointSelect={onPointSelect}
      />

      {/* Cause Analysis (Phase 4) */}
      {causeResult && causeResult.total_non_compliant > 0 && (
        <CauseAnalysisView
          causeResult={causeResult}
          selectedBuildingId={selectedBuildingId}
          onBuildingSelect={onBuildingSelect}
        />
      )}

      {/* Bottom Navigation */}
      <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
        <button
          onClick={onBackToSettings}
          className="border border-red-600/30 hover:bg-red-50 px-6 py-3
            text-sm text-red-600 hover:text-red-700 transition-all duration-300"
        >
          측정점 수정 후 재분석
        </button>
        <button
          onClick={onBackToSettings}
          className="border border-gray-200 hover:border-gray-400 px-6 py-3
            text-sm text-gray-700 hover:text-gray-900 transition-all duration-300"
        >
          {t(txt.backToSettings)}
        </button>
        <button
          onClick={onReset}
          className="border border-gray-200 hover:border-red-600/30 px-6 py-3
            text-sm text-gray-900 hover:text-red-600 transition-all duration-300"
        >
          {t(txt.reset)}
        </button>
      </div>
    </div>
  )
}
