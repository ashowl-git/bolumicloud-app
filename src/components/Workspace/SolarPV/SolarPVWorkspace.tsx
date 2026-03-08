'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useSolarPVPipelineContext } from '@/contexts/SolarPVPipelineContext'
import { useModelLoader } from '@/components/shared/3d/useModelLoader'
import { useWorkspaceLayout } from '../hooks/useWorkspaceLayout'
import { useStatusBarState } from '@/hooks/useStatusBarState'
import { useReportGeneration } from '@/hooks/useReportGeneration'
import type { SolarPVRunConfig } from '@/lib/types/solar-pv'
import { DEFAULT_SOLAR_PV_CONFIG } from '@/lib/types/solar-pv'
import type { LayerConfig } from '@/lib/types/sunlight'
import type { ModelConfig } from '@/components/shared/3d/types'
import { formatDuration, formatEta } from '@/lib/utils/format'

import SolarPVLegend from '@/components/SolarPVAnalysis/3d/SolarPVLegend'

import AnalysisWorkspace from '../AnalysisWorkspace'
import WorkspaceViewport from '../WorkspaceViewport'
import WorkspaceStatusBar from '../WorkspaceStatusBar'
import WorkspaceUploadOverlay from '../WorkspaceUploadOverlay'
import WorkspaceProgressStepper, { type WorkspaceStep } from '../WorkspaceProgressStepper'
import SolarPVSidePanel from './SolarPVSidePanel'

// 3D components (dynamic import for SSR safety)
const SceneLighting = dynamic(() => import('@/components/shared/3d/SceneLighting'), { ssr: false })
const GroundGrid = dynamic(() => import('@/components/shared/3d/GroundGrid'), { ssr: false })
const CompassRose = dynamic(() => import('@/components/shared/3d/CompassRose'), { ssr: false })
const InteractiveBuildingModel = dynamic(() => import('@/components/shared/3d/interaction/InteractiveBuildingModel'), { ssr: false })
const PanelSurfaceHighlight = dynamic(() => import('@/components/SolarPVAnalysis/3d/PanelSurfaceHighlight'), { ssr: false })
const IrradianceHeatmap = dynamic(() => import('@/components/SolarPVAnalysis/3d/IrradianceHeatmap'), { ssr: false })

export default function SolarPVWorkspace() {
  const pipeline = useSolarPVPipelineContext()
  const {
    phase,
    sessionId,
    sceneUrl,
    progress,
    results,
    error,
    estimatedRemainingSec,
    uploadProgress,
    uploadFile,
    runAnalysis,
    cancelAnalysis,
    reset,
    importData,
    modelMeta,
  } = pipeline

  // Config state
  const [config, setConfig] = useState<SolarPVRunConfig>(DEFAULT_SOLAR_PV_CONFIG)
  const [layers, setLayers] = useState<LayerConfig[]>([])
  const [selectedSurface, setSelectedSurface] = useState<string | null>(null)

  // 3D model
  const modelConfig = useMemo<ModelConfig | null>(() =>
    sceneUrl ? { url: sceneUrl, format: 'glb', autoCenter: true, zUp: false } : null,
    [sceneUrl]
  )
  const { state: modelState, scene: modelScene, bbox: modelBbox } = useModelLoader(modelConfig)
  const hasModel = modelState === 'loaded' && !!modelScene

  // Layout
  const layout = useWorkspaceLayout({ hasModel })

  // Initialize layers from importData groups (8-color palette)
  useEffect(() => {
    const LAYER_COLORS = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316']
    if (!importData?.groups || importData.groups.length === 0) return
    setLayers(importData.groups.map((g, i) => ({
      id: g.name,
      name: g.name,
      visible: g.visible ?? true,
      isAnalysisTarget: true,
      color: g.color || LAYER_COLORS[i % LAYER_COLORS.length],
    })))
  }, [importData?.groups])

  // Auto-switch to results tab on completion
  useEffect(() => {
    if (phase === 'completed' && results) {
      layout.setActivePanelTab('results')
      layout.setSidePanelOpen(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, results])

  // Fetch module presets on mount
  useEffect(() => {
    pipeline.fetchModulePresets()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Browser tab title
  useEffect(() => {
    if (phase === 'polling' && progress) {
      document.title = `[${progress.overall_progress}%] 태양광 분석 - BoLumiCloud`
    } else if (phase === 'completed') {
      document.title = '[완료] 태양광 분석 - BoLumiCloud'
    } else {
      document.title = '태양광 발전 분석 - BoLumiCloud'
    }
    return () => { document.title = 'BoLumiCloud' }
  }, [phase, progress])

  const handleFileSelect = useCallback(async (file: File, mtlFile?: File) => {
    await uploadFile(file, mtlFile)
  }, [uploadFile])

  const handleConfigChange = useCallback((partial: Partial<SolarPVRunConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }))
  }, [])

  const handleToggleLayerVisibility = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l))
  }, [])

  const handleToggleAnalysisTarget = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, isAnalysisTarget: !l.isAnalysisTarget } : l))
  }, [])

  const handleToggleAllLayers = useCallback((visible: boolean) => {
    setLayers(prev => prev.map(l => ({ ...l, visible })))
  }, [])

  const handleStartAnalysis = useCallback(async () => {
    const panelLayerIds = layers
      .filter(l => l.isAnalysisTarget)
      .map(l => l.name)

    const runConfig: SolarPVRunConfig = {
      ...config,
      panel_layer_ids: panelLayerIds,
      excluded_groups: layers.filter(l => !l.visible).map(l => l.name),
    }

    await runAnalysis(runConfig)
  }, [config, layers, runAnalysis])

  const isRunning = phase === 'running' || phase === 'polling'

  // Report generation
  const report = useReportGeneration({
    sessionId,
    analysisType: 'solar_pv',
    results,
    autoGenerate: true,
  })

  // Status bar state
  const statusBarState = useStatusBarState({ phase, error })

  // Progress stepper step
  const currentStep = useMemo((): WorkspaceStep => {
    if (phase === 'completed') return 'results'
    if (phase === 'running' || phase === 'polling') return 'analyze'
    if (hasModel) return 'configure'
    return 'upload'
  }, [phase, hasModel])

  const statusStageName = progress?.stages.find((s) => s.status === 'processing')?.name

  // Hidden groups for 3D
  const hiddenGroups = useMemo(() => {
    const set = new Set<string>()
    layers.forEach(l => { if (!l.visible) set.add(l.id) })
    return set
  }, [layers])

  // Surface coordinate maps for IrradianceHeatmap (from result data)
  const { surfaceCenters, surfaceNormals, surfaceAreas } = useMemo(() => {
    if (!results?.surfaces) return { surfaceCenters: {}, surfaceNormals: {}, surfaceAreas: {} }
    const centers: Record<string, [number, number, number]> = {}
    const normals: Record<string, [number, number, number]> = {}
    const areas: Record<string, number> = {}
    for (const s of results.surfaces) {
      centers[s.surface_id] = s.center
      normals[s.surface_id] = s.normal
      areas[s.surface_id] = s.area_m2
    }
    return { surfaceCenters: centers, surfaceNormals: normals, surfaceAreas: areas }
  }, [results?.surfaces])

  // Panel surface info for PanelSurfaceHighlight (pre-results mode)
  const panelSurfacesForHighlight = useMemo(() => {
    if (!results?.surfaces) return []
    return results.surfaces.map(s => ({
      surface_id: s.surface_id,
      center: s.center,
      normal: s.normal,
      area_m2: s.area_m2,
    }))
  }, [results?.surfaces])

  return (
    <AnalysisWorkspace
      progressStepper={<WorkspaceProgressStepper currentStep={currentStep} />}
      sidePanel={
        <SolarPVSidePanel
          open={layout.sidePanelOpen}
          onClose={layout.closePanel}
          onOpen={() => layout.openPanel()}
          config={config}
          onConfigChange={handleConfigChange}
          layers={layers}
          onToggleLayerVisibility={handleToggleLayerVisibility}
          onToggleAnalysisTarget={handleToggleAnalysisTarget}
          onToggleAllLayers={handleToggleAllLayers}
          isRunning={isRunning}
          onStartAnalysis={handleStartAnalysis}
          onCancelAnalysis={cancelAnalysis}
          results={results}
          error={error}
          progress={progress}
          selectedSurface={selectedSurface}
          onSelectSurface={setSelectedSurface}
          modulePresets={pipeline.modulePresets}
          activeTab={layout.activePanelTab}
          onTabChange={layout.setActivePanelTab}
          onGenerateReport={report.generateReport}
          reportDownloadUrl={report.reportDownloadUrl}
          isGeneratingReport={report.isGeneratingReport}
        />
      }
      statusBar={
        <WorkspaceStatusBar
          state={statusBarState}
          modelInfo={modelMeta
            ? `${modelMeta.original_name} | V: ${modelMeta.vertices.toLocaleString()} F: ${modelMeta.faces.toLocaleString()}`
            : undefined}
          stageName={statusStageName}
          analysisProgress={progress?.overall_progress}
          etaText={estimatedRemainingSec ? formatEta(estimatedRemainingSec) : undefined}
          completionTime={results?.metadata?.computation_time_sec
            ? `${formatDuration(results.metadata.computation_time_sec as number)}`
            : undefined}
          errorMessage={error || undefined}
          onViewResults={() => {
            layout.setActivePanelTab('results')
            layout.setSidePanelOpen(true)
          }}
          onRetry={handleStartAnalysis}
          onReset={reset}
          onCancel={cancelAnalysis}
        />
      }
      uploadOverlay={
        layout.isUploadOverlayVisible && !hasModel ? (
          <WorkspaceUploadOverlay
            onFileSelect={handleFileSelect}
            isUploading={phase === 'uploading'}
            uploadProgress={uploadProgress}
          />
        ) : undefined
      }
    >
      {/* 3D Viewport */}
      <WorkspaceViewport bbox={modelBbox}>
        <SceneLighting />

        {modelScene && (
          <InteractiveBuildingModel
            scene={modelScene}
            bbox={modelBbox}
            interactionEnabled={false}
            groups={importData?.groups}
            hiddenGroups={hiddenGroups}
          />
        )}

        {/* Panel surface highlight (score-based heatmap when results available) */}
        {results && results.surfaces.length > 0 && (
          <IrradianceHeatmap
            surfaces={results.surfaces}
            selectedSurfaceId={selectedSurface}
            onSurfaceClick={setSelectedSurface}
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
            onSurfaceClick={setSelectedSurface}
          />
        )}

        <GroundGrid bbox={modelBbox} />
        <CompassRose bbox={modelBbox} />
      </WorkspaceViewport>

      {/* Legend overlay (HTML) */}
      {results && hasModel && (
        <SolarPVLegend
          totalCapacityKwp={results.summary.total_capacity_kwp}
          totalAnnualMwh={results.summary.annual_generation_kwh / 1000}
        />
      )}
    </AnalysisWorkspace>
  )
}
