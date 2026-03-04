'use client'

import { useCallback } from 'react'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import type { LocalizedText } from '@/lib/types/i18n'
import type { SunlightConfigState } from '@/lib/types/sunlight'
import type { CameraPresetId, BoundingBox } from '@/components/shared/3d/types'
import type { BaseAnalysisPoint, InteractionMode } from '@/components/shared/3d/interaction/types'
import type { AreaDefinition } from '@/components/shared/3d/interaction/useAreaPlacement'

import SunlightConfigPanel from '../SunlightConfigPanel'
import CameraPresetBar from '@/components/shared/3d/CameraPresetBar'
import InteractionToolbar from '@/components/shared/3d/interaction/InteractionToolbar'
import type { Group } from 'three'

import dynamic from 'next/dynamic'
const ThreeViewer = dynamic(() => import('@/components/shared/3d/ThreeViewer'), { ssr: false })
const SceneLighting = dynamic(() => import('@/components/shared/3d/SceneLighting'), { ssr: false })
const GroundGrid = dynamic(() => import('@/components/shared/3d/GroundGrid'), { ssr: false })
const CompassRose = dynamic(() => import('@/components/shared/3d/CompassRose'), { ssr: false })
const InteractiveBuildingModel = dynamic(() => import('@/components/shared/3d/interaction/InteractiveBuildingModel'), { ssr: false })
const InteractiveGround = dynamic(() => import('@/components/shared/3d/interaction/InteractiveGround'), { ssr: false })
const SurfaceHighlight = dynamic(() => import('@/components/shared/3d/interaction/SurfaceHighlight'), { ssr: false })
const PointMarker3D = dynamic(() => import('@/components/shared/3d/interaction/PointMarker3D'), { ssr: false })
const AreaGridPreview = dynamic(() => import('@/components/shared/3d/interaction/AreaGridPreview'), { ssr: false })

const txt = {
  back: { ko: '이전', en: 'Back' } as LocalizedText,
  startAnalysis: { ko: '분석 시작', en: 'Start Analysis' } as LocalizedText,
  running: { ko: '분석 중...', en: 'Analyzing...' } as LocalizedText,
}

export interface SettingsStepProps {
  config: SunlightConfigState
  onConfigChange: (partial: Partial<SunlightConfigState>) => void
  isRunning: boolean
  modelScene: Group | null
  modelBbox: BoundingBox | null
  cameraPreset: CameraPresetId
  onCameraPresetChange: (preset: CameraPresetId) => void
  placement: {
    mode: InteractionMode
    points: BaseAnalysisPoint[]
    hoverHit: any
    selectedPointId: string | null
    setMode: (mode: InteractionMode) => void
    setHoverHit: (hit: any) => void
    handleSurfaceClick: (hit: any) => void
    handlePointClick: (id: string) => void
    clearPoints: () => void
    setPoints: (pts: BaseAnalysisPoint[]) => void
    selectPoint: (id: string | null) => void
  }
  areaPlacement: {
    firstCorner: [number, number, number] | null
    previewCorner: [number, number, number] | null
    area: AreaDefinition | null
    gridSpacing: number
    gridPoints: BaseAnalysisPoint[]
    setGridSpacing: (spacing: number) => void
    handleAreaClick: (hit: any) => void
    handleAreaHover: (hit: any) => void
    generateGrid: () => BaseAnalysisPoint[]
    resetArea: () => void
  }
  onBack: () => void
  onStartAnalysis: () => void
}

export default function SettingsStep({
  config,
  onConfigChange,
  isRunning,
  modelScene,
  modelBbox,
  cameraPreset,
  onCameraPresetChange,
  placement,
  areaPlacement,
  onBack,
  onStartAnalysis,
}: SettingsStepProps) {
  const { t } = useLocalizedText()

  const handleModeChange = useCallback((m: any) => {
    placement.setMode(m)
    if (m !== 'place_area') areaPlacement.resetArea()
  }, [placement, areaPlacement])

  const handleClearAll = useCallback(() => {
    placement.clearPoints()
    areaPlacement.resetArea()
  }, [placement, areaPlacement])

  return (
    <div className="space-y-8">
      <div className={`${modelScene ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : ''}`}>
        {/* Settings Panel */}
        <div className="space-y-6">
          <SunlightConfigPanel
            config={config}
            onChange={onConfigChange}
            disabled={isRunning}
          />
        </div>

        {/* 3D Preview + Measurement Points */}
        {modelScene && (
          <div className="border border-gray-200 relative">
            <InteractionToolbar
              analysisType="sunlight"
              mode={placement.mode}
              pointCount={placement.points.length}
              onModeChange={handleModeChange}
              onClearAll={handleClearAll}
            />
            <ThreeViewer
              bbox={modelBbox}
              height="400px"
              orbitEnabled={placement.mode === 'navigate'}
            >
              <SceneLighting />
              <InteractiveBuildingModel
                scene={modelScene}
                bbox={modelBbox}
                interactionEnabled={placement.mode === 'place_point'}
                onSurfaceHover={placement.setHoverHit}
                onSurfaceClick={placement.handleSurfaceClick}
              />
              <InteractiveGround
                bbox={modelBbox}
                enabled={placement.mode === 'place_point' || placement.mode === 'place_area'}
                onGroundHover={(hit) => {
                  if (placement.mode === 'place_area') areaPlacement.handleAreaHover(hit)
                  else placement.setHoverHit(hit)
                }}
                onGroundClick={(hit) => {
                  if (placement.mode === 'place_area') areaPlacement.handleAreaClick(hit)
                  else placement.handleSurfaceClick(hit)
                }}
              />
              <GroundGrid bbox={modelBbox} />
              <CompassRose bbox={modelBbox} />
              {placement.mode !== 'place_area' && (
                <SurfaceHighlight hit={placement.hoverHit} />
              )}
              <AreaGridPreview
                firstCorner={areaPlacement.firstCorner}
                previewCorner={areaPlacement.previewCorner}
                area={areaPlacement.area}
                gridSpacing={areaPlacement.gridSpacing}
                gridPointCount={areaPlacement.gridPoints.length}
              />
              {placement.points.map((point) => (
                <PointMarker3D
                  key={point.id}
                  point={point}
                  visualType={point.surfaceType === 'ground' ? 'sphere' : 'disc'}
                  isSelected={point.id === placement.selectedPointId}
                  color={point.surfaceType === 'ground' ? '#ffffff' : '#60a5fa'}
                  onClick={() => placement.handlePointClick(point.id)}
                />
              ))}
            </ThreeViewer>
            <CameraPresetBar
              bbox={modelBbox}
              activePreset={cameraPreset}
              onPresetChange={onCameraPresetChange}
            />
            {/* Area grid controls */}
            {areaPlacement.area && (
              <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-3">
                <span className="text-xs text-gray-500">격자 간격</span>
                <input
                  type="number"
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={areaPlacement.gridSpacing}
                  onChange={(e) => areaPlacement.setGridSpacing(Number(e.target.value))}
                  className="w-16 border border-gray-200 px-2 py-0.5 text-xs text-center"
                />
                <span className="text-xs text-gray-400">m</span>
                <button
                  onClick={() => {
                    const pts = areaPlacement.generateGrid()
                    placement.setPoints([...placement.points, ...pts])
                    areaPlacement.resetArea()
                    placement.setMode('navigate')
                  }}
                  className="text-xs text-red-600 hover:text-red-800 border border-red-200 px-2 py-0.5"
                >
                  격자 생성
                </button>
                <button
                  onClick={() => areaPlacement.resetArea()}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  취소
                </button>
              </div>
            )}
            {/* Point count */}
            {placement.points.length > 0 && !areaPlacement.area && (
              <div className="px-4 py-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {placement.points.length}개 측정점 배치됨
                  {placement.mode === 'place_point' && ' — 지면 또는 건물 표면을 클릭하여 추가'}
                  {placement.mode === 'place_area' && (areaPlacement.firstCorner
                    ? ' — 두 번째 모서리를 클릭하여 영역 확정'
                    : ' — 지면을 클릭하여 영역의 첫 모서리 지정'
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Start Button */}
      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <button
          onClick={onBack}
          className="border border-gray-200 hover:border-gray-400 px-6 py-3
            text-sm text-gray-700 hover:text-gray-900 transition-all duration-300"
        >
          {t(txt.back)}
        </button>
        <button
          onClick={onStartAnalysis}
          disabled={isRunning}
          className="border border-gray-200 hover:border-red-600/30 px-8 py-3
            text-gray-900 hover:text-red-600 transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? t(txt.running) : t(txt.startAnalysis)}
        </button>
      </div>
    </div>
  )
}
