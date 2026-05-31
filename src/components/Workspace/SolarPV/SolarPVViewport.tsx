'use client'

import { memo } from 'react'
import dynamic from 'next/dynamic'
import * as THREE from 'three'
import type { BoundingBox, CameraPresetId } from '@/components/shared/3d/types'
import type { SolarPVResult } from '@/lib/types/solar-pv'
import type { ShadowAccumulationCell } from '@/components/SolarPVAnalysis/3d/SolarPVShadowHeatmap'
import type { ReflectionFrame } from '@/components/SolarPVAnalysis/3d/ReflectionOverlay'
import WorkspaceViewport from '../WorkspaceViewport'
import SolarPVLegend from '@/components/SolarPVAnalysis/3d/SolarPVLegend'

// 3D components (dynamic import for SSR safety)
const SunShadowLight = dynamic(() => import('@/components/shared/3d/SunShadowLight'), { ssr: false })
const GroundGrid = dynamic(() => import('@/components/shared/3d/GroundGrid'), { ssr: false })
const CompassRose = dynamic(() => import('@/components/shared/3d/CompassRose'), { ssr: false })
const InteractiveBuildingModel = dynamic(() => import('@/components/shared/3d/interaction/InteractiveBuildingModel'), { ssr: false })
const PanelSurfaceHighlight = dynamic(() => import('@/components/SolarPVAnalysis/3d/PanelSurfaceHighlight'), { ssr: false })
const IrradianceHeatmap = dynamic(() => import('@/components/SolarPVAnalysis/3d/IrradianceHeatmap'), { ssr: false })
const SunPositionIndicator = dynamic(() => import('@/components/SunlightAnalysis/3d/SunPositionIndicator'), { ssr: false })
const SolarPVShadowHeatmap = dynamic(() => import('@/components/SolarPVAnalysis/3d/SolarPVShadowHeatmap'), { ssr: false })
const ReflectionOverlay = dynamic(() => import('@/components/SolarPVAnalysis/3d/ReflectionOverlay'), { ssr: false })
const CameraPresetApplier = dynamic(() => import('@/components/shared/3d/CameraPresetBar').then(m => ({ default: m.CameraPresetApplier })), { ssr: false })

export interface SolarPVViewportProps {
  // Scene / model
  sunDirection: [number, number, number]
  modelScene: THREE.Group | null
  modelBbox: BoundingBox | null
  importDataGroups: { name: string; vertexCount: number; faceCount: number; color?: string; visible: boolean }[] | undefined
  hiddenGroups: Set<string>
  hasModel: boolean

  // Results & surfaces
  results: SolarPVResult | null
  selectedSurface: string | null
  onSelectSurface: (id: string | null) => void
  surfaceCenters: Record<string, [number, number, number]>
  surfaceNormals: Record<string, [number, number, number]>
  surfaceAreas: Record<string, number>
  panelSurfacesForHighlight: {
    surface_id: string
    center: [number, number, number]
    normal: [number, number, number]
    area_m2: number
  }[]

  // Shadow heatmap
  showShadowHeatmap: boolean
  shadowAccumulation: {
    cells: ShadowAccumulationCell[]
    cellSize: number
    maxShadowHours: number
  } | null
  shadowHeatmapMode: 'hours' | 'ratio'

  // Reflection overlay
  showReflection: boolean
  currentReflectionFrame: ReflectionFrame | null

  // Sun position
  solarPosition: { altitude: number; azimuth: number }

  // Camera preset
  activePreset: CameraPresetId
  presetTrigger: number
  onPresetChange: (id: CameraPresetId) => void
}

const CAMERA_PRESET_LABELS: Record<CameraPresetId, string> = {
  perspective: '3D',
  top: '탑',
  south: '남',
  north: '북',
  east: '동',
  west: '서',
}

const CAMERA_PRESET_IDS: CameraPresetId[] = ['perspective', 'top', 'south', 'north', 'east', 'west']

function SolarPVViewport({
  sunDirection,
  modelScene,
  modelBbox,
  importDataGroups,
  hiddenGroups,
  hasModel,
  results,
  selectedSurface,
  onSelectSurface,
  surfaceCenters,
  surfaceNormals,
  surfaceAreas,
  panelSurfacesForHighlight,
  showShadowHeatmap,
  shadowAccumulation,
  shadowHeatmapMode,
  showReflection,
  currentReflectionFrame,
  solarPosition,
  activePreset,
  presetTrigger,
  onPresetChange,
}: SolarPVViewportProps) {
  return (
    <>
      {/* 3D Viewport */}
      <WorkspaceViewport bbox={modelBbox} enableShadows>
        <SunShadowLight
          sunDirection={sunDirection}
          modelBbox={modelBbox}
        />

        {modelScene && (
          <InteractiveBuildingModel
            scene={modelScene}
            bbox={modelBbox}
            interactionEnabled={false}
            groups={importDataGroups}
            hiddenGroups={hiddenGroups}
          />
        )}

        {/* Panel surface highlight (score-based heatmap when results available) */}
        {results && results.surfaces.length > 0 && (
          <IrradianceHeatmap
            surfaces={results.surfaces}
            selectedSurfaceId={selectedSurface}
            onSurfaceClick={onSelectSurface}
            surfaceCenters={surfaceCenters}
            surfaceNormals={surfaceNormals}
            surfaceAreas={surfaceAreas}
          />
        )}

        {/* Panel surfaces pre-highlight (before results, if panel info available from config) */}
        {!results && panelSurfacesForHighlight.length > 0 && (
          <PanelSurfaceHighlight
            surfaces={panelSurfacesForHighlight as never}
            selectedSurfaceId={selectedSurface}
            onSurfaceClick={onSelectSurface}
          />
        )}

        <GroundGrid bbox={modelBbox} />
        <CompassRose bbox={modelBbox} />

        {/* Shadow accumulation heatmap */}
        {showShadowHeatmap && shadowAccumulation && (
          <SolarPVShadowHeatmap
            cells={shadowAccumulation.cells}
            cellSize={shadowAccumulation.cellSize}
            maxShadowHours={shadowAccumulation.maxShadowHours}
            mode={shadowHeatmapMode}
          />
        )}

        {/* Reflection overlay (synced with shadow playback) */}
        {showReflection && currentReflectionFrame && (
          <ReflectionOverlay frame={currentReflectionFrame} />
        )}

        {/* Sun position indicator */}
        {hasModel && solarPosition && solarPosition.altitude > 0 && (
          <SunPositionIndicator solarPosition={solarPosition} />
        )}

        {/* Camera preset controller (R3F) */}
        <CameraPresetApplier presetId={activePreset} trigger={presetTrigger} bbox={modelBbox} />
      </WorkspaceViewport>

      {/* Camera preset bar (HTML overlay) — top-left */}
      {hasModel && (
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <div className="pointer-events-auto flex gap-0.5 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg rounded-lg px-1.5 py-1">
            {CAMERA_PRESET_IDS.map((id) => (
              <button
                key={id}
                onClick={() => onPresetChange(id)}
                className={`px-2.5 py-1.5 text-[11px] rounded transition-all duration-200 ${
                  activePreset === id
                    ? 'bg-gray-900 text-white font-medium'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {CAMERA_PRESET_LABELS[id]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Legend overlay (HTML) */}
      {results && hasModel && (
        <SolarPVLegend
          totalCapacityKwp={results.summary.total_capacity_kwp}
          totalAnnualMwh={results.summary.annual_generation_kwh / 1000}
        />
      )}
    </>
  )
}

export default memo(SolarPVViewport)
