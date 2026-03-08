'use client'

import React, { memo } from 'react'
import dynamic from 'next/dynamic'
import * as THREE from 'three'
import type { BoundingBox, CameraPresetId } from '@/components/shared/3d/types'
import type { BaseAnalysisPoint, SurfaceHit } from '@/components/shared/3d/interaction/types'
import type {
  SunlightAnalysisResult,
  CauseAnalysisResult,
  GroundAnalysisResult,
  IsochroneLine,
  BuildingGroupInfo,
} from '@/lib/types/sunlight'
import type { ShadowAccumulation } from '@/components/SunlightAnalysis/hooks/useShadowAnimation'
import WorkspaceViewport from '../WorkspaceViewport'
import ViewportGuideOverlay from '../ViewportGuideOverlay'
import { KeyboardShortcutOverlay } from '../WorkspaceToolbar'
import SunlightLegend from '@/components/SunlightAnalysis/3d/SunlightLegend'
import CameraPresetBar from '@/components/shared/3d/CameraPresetBar'
import { SUNLIGHT_TOOLBAR_MODES } from './SunlightToolbarConfig'

// 3D components (dynamic import for SSR safety)
const SunShadowLight = dynamic(() => import('@/components/shared/3d/SunShadowLight'), { ssr: false })
const GroundGrid = dynamic(() => import('@/components/shared/3d/GroundGrid'), { ssr: false })
const CompassRose = dynamic(() => import('@/components/shared/3d/CompassRose'), { ssr: false })
const InteractiveBuildingModel = dynamic(() => import('@/components/shared/3d/interaction/InteractiveBuildingModel'), { ssr: false })
const InteractiveGround = dynamic(() => import('@/components/shared/3d/interaction/InteractiveGround'), { ssr: false })
const SurfaceHighlight = dynamic(() => import('@/components/shared/3d/interaction/SurfaceHighlight'), { ssr: false })
const PointMarker3D = dynamic(() => import('@/components/shared/3d/interaction/PointMarker3D'), { ssr: false })
const AreaGridPreview = dynamic(() => import('@/components/shared/3d/interaction/AreaGridPreview'), { ssr: false })
const SunlightHeatmapOverlay = dynamic(() => import('@/components/SunlightAnalysis/3d/SunlightHeatmapOverlay'), { ssr: false })
const SunPositionIndicator = dynamic(() => import('@/components/SunlightAnalysis/3d/SunPositionIndicator'), { ssr: false })
const ViolationHighlight = dynamic(() => import('@/components/SunlightAnalysis/3d/ViolationHighlight'), { ssr: false })
const BuildingLabels3D = dynamic(() => import('@/components/SunlightAnalysis/3d/BuildingLabels3D'), { ssr: false })
const ModelTransformControls = dynamic(() => import('@/components/shared/3d/interaction/ModelTransformControls'), { ssr: false })
const GroundHeatmap = dynamic(() => import('@/components/SunlightAnalysis/3d/GroundHeatmap'), { ssr: false })
const ContourLines = dynamic(() => import('@/components/SunlightAnalysis/3d/ContourLines'), { ssr: false })
const SolarChart3DOverlay = dynamic(() => import('@/components/SunlightAnalysis/3d/SolarChart3DOverlay'), { ssr: false })
const ShadowAccumulationOverlay = dynamic(() => import('@/components/SunlightAnalysis/3d/ShadowAccumulationOverlay'), { ssr: false })
const CameraPresetApplier = dynamic(() => import('@/components/shared/3d/CameraPresetBar').then(m => ({ default: m.CameraPresetApplier })), { ssr: false })

// ── Types ──────────────────────────────────────────────────────────────────

interface SolarPosition {
  altitude: number
  azimuth: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SolarChartData = any

export interface SunlightViewportProps {
  // Model
  modelScene: THREE.Group | null
  modelBbox: BoundingBox | null
  hasModel: boolean
  importData: {
    groups?: BuildingGroupInfo[]
  } | null

  // Camera
  activePreset: CameraPresetId
  presetTrigger: number
  onPresetChange: (id: CameraPresetId) => void

  // Interaction mode
  placementMode: string
  hoverHit: SurfaceHit | null
  selectedPointId: string | null
  points: BaseAnalysisPoint[]
  onSurfaceHover: (hit: SurfaceHit | null) => void
  onSurfaceClick: (hit: SurfaceHit) => void
  onPointClick: (id: string) => void
  onSelectPoint: (id: string) => void

  // Area placement
  areaFirstCorner: [number, number, number] | null
  areaPreviewCorner: [number, number, number] | null
  areaArea: { corner1: [number, number, number]; corner2: [number, number, number] } | null
  areaGridSpacing: number
  areaGridPoints: BaseAnalysisPoint[]
  onAreaHover: (hit: SurfaceHit | null) => void
  onAreaClick: (hit: SurfaceHit) => void

  // Transform
  transformMode: 'translate' | 'rotate'

  // Hidden groups
  hiddenGroups: Set<string>

  // Sun
  sunDirection: [number, number, number]
  solarPosition: SolarPosition

  // Results
  results: SunlightAnalysisResult | null
  causeResult: CauseAnalysisResult | null
  selectedBuildingId: string | null
  onBuildingClick: (id: string) => void

  // Ground analysis
  showGroundHeatmap: boolean
  groundResult: GroundAnalysisResult | null
  groundIsochrones: IsochroneLine[]

  // Shadow accumulation
  showAccumulation: boolean
  shadowAccumulation: ShadowAccumulation | null

  // Solar chart
  solarChartData: SolarChartData

  // UI state
  isShortcutOverlayVisible: boolean
  onCloseShortcutOverlay: () => void
  isRunning: boolean
}

const VIEWPORT_GUIDE_STEPS = [
  { key: 'mode', label: 'P 키를 눌러 측정점 모드 전환' },
  { key: 'click', label: '건물 표면을 클릭하여 측정점 배치' },
  { key: 'analyze', label: '사이드 패널에서 분석 실행' },
]

// ── Component ──────────────────────────────────────────────────────────────

function SunlightViewport({
  modelScene,
  modelBbox,
  hasModel,
  importData,
  activePreset,
  presetTrigger,
  onPresetChange,
  placementMode,
  hoverHit,
  selectedPointId,
  points,
  onSurfaceHover,
  onSurfaceClick,
  onPointClick,
  onSelectPoint,
  areaFirstCorner,
  areaPreviewCorner,
  areaArea,
  areaGridSpacing,
  areaGridPoints,
  onAreaHover,
  onAreaClick,
  transformMode,
  hiddenGroups,
  sunDirection,
  solarPosition,
  results,
  causeResult,
  selectedBuildingId,
  onBuildingClick,
  showGroundHeatmap,
  groundResult,
  groundIsochrones,
  showAccumulation,
  shadowAccumulation,
  solarChartData,
  isShortcutOverlayVisible,
  onCloseShortcutOverlay,
  isRunning,
}: SunlightViewportProps) {
  return (
    <>
      {/* 3D Viewport */}
      <WorkspaceViewport
        bbox={modelBbox}
        orbitEnabled={placementMode === 'navigate'}
        enableShadows
      >
        <SunShadowLight
          sunDirection={sunDirection}
          modelBbox={modelBbox}
        />

        {/* Building model (interactive when placing points) */}
        {modelScene && (
          <InteractiveBuildingModel
            scene={modelScene}
            bbox={modelBbox}
            interactionEnabled={placementMode === 'place_point'}
            onSurfaceHover={onSurfaceHover}
            onSurfaceClick={onSurfaceClick}
            groups={importData?.groups}
            hiddenGroups={hiddenGroups}
          />
        )}

        {/* Transform controls */}
        {placementMode === 'transform' && modelScene && (
          <ModelTransformControls
            target={modelScene}
            mode={transformMode}
            onTransformEnd={() => {
              // Transform applied client-side only
            }}
          />
        )}

        {/* Ground interaction */}
        {modelScene && (
          <InteractiveGround
            bbox={modelBbox}
            enabled={placementMode === 'place_point' || placementMode === 'place_area'}
            onGroundHover={(hit) => {
              if (placementMode === 'place_area') onAreaHover(hit)
              else onSurfaceHover(hit)
            }}
            onGroundClick={(hit) => {
              if (placementMode === 'place_area') onAreaClick(hit)
              else onSurfaceClick(hit)
            }}
          />
        )}

        {/* Grid & compass */}
        <GroundGrid bbox={modelBbox} />
        <CompassRose bbox={modelBbox} />

        {/* Surface hover highlight */}
        {placementMode !== 'place_area' && (
          <SurfaceHighlight hit={hoverHit} />
        )}

        {/* Area grid preview */}
        <AreaGridPreview
          firstCorner={areaFirstCorner}
          previewCorner={areaPreviewCorner}
          area={areaArea}
          gridSpacing={areaGridSpacing}
          gridPointCount={areaGridPoints.length}
        />

        {/* Point markers */}
        {points.map((point) => (
          <PointMarker3D
            key={point.id}
            point={point}
            visualType={point.surfaceType === 'ground' ? 'sphere' : 'disc'}
            isSelected={point.id === selectedPointId}
            color={point.surfaceType === 'ground' ? '#ffffff' : '#60a5fa'}
            onClick={() => onPointClick(point.id)}
          />
        ))}

        {/* Sun position indicator (always visible when model loaded) */}
        {hasModel && solarPosition && solarPosition.altitude > 0 && (
          <SunPositionIndicator solarPosition={solarPosition} />
        )}

        {/* Ground heatmap overlay */}
        {showGroundHeatmap && groundResult && groundResult.grid_data.length > 0 && (
          <GroundHeatmap
            gridData={groundResult.grid_data}
            gridSize={groundResult.grid_size}
          />
        )}

        {/* Isochrone / contour lines */}
        {showGroundHeatmap && groundIsochrones.length > 0 && (
          <ContourLines lines={groundIsochrones} />
        )}

        {/* Heatmap overlay (results) */}
        {results && results.points.length > 0 && (
          <SunlightHeatmapOverlay
            points={points.length > 0
              ? points.map((p) => ({ id: p.id, x: p.position.x, y: p.position.y, z: p.position.z, name: p.name }))
              : results.points.map((p) => ({ id: p.id, x: p.x, y: p.y, z: p.z, name: p.name }))
            }
            results={results.points}
            selectedPointId={selectedPointId}
            onPointClick={onSelectPoint}
          />
        )}

        {/* Building labels + Violation highlight (cause analysis) */}
        {causeResult && causeResult.buildings.length > 0 && (
          <BuildingLabels3D
            buildings={causeResult.buildings}
            selectedBuildingId={selectedBuildingId}
            onBuildingClick={onBuildingClick}
          />
        )}
        {causeResult && causeResult.point_causes.length > 0 && (
          <ViolationHighlight
            blockers={causeResult.point_causes.flatMap((pc) => pc.blockers)}
            selectedBuildingId={selectedBuildingId}
          />
        )}

        {/* Solar chart 3D overlay */}
        {solarChartData && (
          <SolarChart3DOverlay data={solarChartData} />
        )}

        {/* Shadow accumulation heatmap (toggled via button) */}
        {showAccumulation && shadowAccumulation && shadowAccumulation.cells.length > 0 && (
          <ShadowAccumulationOverlay
            cells={shadowAccumulation.cells}
            cellSize={shadowAccumulation.cell_size}
            maxShadowHours={shadowAccumulation.max_shadow_hours}
          />
        )}

        {/* Camera preset controller (R3F) */}
        <CameraPresetApplier presetId={activePreset} trigger={presetTrigger} bbox={modelBbox} />
      </WorkspaceViewport>

      {/* Camera preset bar (HTML overlay) */}
      {hasModel && (
        <CameraPresetBar
          bbox={modelBbox}
          activePreset={activePreset}
          onPresetChange={onPresetChange}
        />
      )}

      {/* Mode indicator + Legend overlay */}
      {hasModel && (
        <div className="absolute bottom-16 left-3 z-10 space-y-2">
          {results && results.points.length > 0 && <SunlightLegend />}
          {placementMode !== 'navigate' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm
              text-white text-[11px] rounded-full shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              {SUNLIGHT_TOOLBAR_MODES.find(m => m.id === placementMode)?.label ?? placementMode}
              <span className="text-white/40 ml-1">ESC로 해제</span>
            </div>
          )}
        </div>
      )}

      {/* Keyboard shortcut help overlay */}
      {isShortcutOverlayVisible && (
        <KeyboardShortcutOverlay
          modes={SUNLIGHT_TOOLBAR_MODES}
          onClose={onCloseShortcutOverlay}
        />
      )}

      {/* Viewport guide — shown after model load, before first point */}
      <ViewportGuideOverlay
        visible={hasModel && points.length === 0 && !results && !isRunning}
        steps={VIEWPORT_GUIDE_STEPS}
      />
    </>
  )
}

export default memo(SunlightViewport)
