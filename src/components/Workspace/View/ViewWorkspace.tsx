'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useViewPipelineContext } from '@/contexts/ViewPipelineContext'
import { useModelLoader } from '@/components/shared/3d/useModelLoader'
import { usePointPlacement } from '@/components/shared/3d/interaction/usePointPlacement'
import { useWorkspaceLayout } from '../hooks/useWorkspaceLayout'
import { useReportGeneration } from '@/hooks/useReportGeneration'
import type { ViewConfig, ViewConfigState } from '@/lib/types/view'
import type { ModelConfig } from '@/components/shared/3d/types'
import { DEFAULT_VIEW_CONFIG } from '@/lib/defaults/view'
import { formatDuration, formatEta } from '@/lib/utils/format'
import type { StatusBarState } from '../WorkspaceStatusBar'
import { Undo2, Redo2 } from 'lucide-react'

import { useToast } from '@/contexts/ToastContext'
import AnalysisWorkspace from '../AnalysisWorkspace'
import WorkspaceViewport from '../WorkspaceViewport'
import WorkspaceToolbar, { KeyboardShortcutOverlay } from '../WorkspaceToolbar'
import WorkspaceStatusBar from '../WorkspaceStatusBar'
import WorkspaceUploadOverlay from '../WorkspaceUploadOverlay'
import ViewSidePanel from './ViewSidePanel'
import { VIEW_TOOLBAR_MODES } from './ViewToolbarConfig'

const SceneLighting = dynamic(() => import('@/components/shared/3d/SceneLighting'), { ssr: false })
const GroundGrid = dynamic(() => import('@/components/shared/3d/GroundGrid'), { ssr: false })
const CompassRose = dynamic(() => import('@/components/shared/3d/CompassRose'), { ssr: false })
const InteractiveBuildingModel = dynamic(() => import('@/components/shared/3d/interaction/InteractiveBuildingModel'), { ssr: false })
const SurfaceHighlight = dynamic(() => import('@/components/shared/3d/interaction/SurfaceHighlight'), { ssr: false })
const PointMarker3D = dynamic(() => import('@/components/shared/3d/interaction/PointMarker3D'), { ssr: false })

export default function ViewWorkspace() {
  const pipeline = useViewPipelineContext()
  const {
    phase, sessionId, sceneUrl, modelMeta,
    progress, results, error, estimatedRemainingSec,
    uploadFile, runAnalysis, cancelAnalysis, reset,
  } = pipeline

  const { showToast } = useToast()

  useEffect(() => {
    if (error) {
      showToast({ type: 'error', message: error })
    }
  }, [error, showToast])

  const [config, setConfig] = useState<ViewConfigState>({ ...DEFAULT_VIEW_CONFIG })

  // 3D model
  const modelConfig = useMemo<ModelConfig | null>(() =>
    sceneUrl ? { url: sceneUrl, format: 'glb', autoCenter: true, zUp: false } : null,
    [sceneUrl]
  )
  const { state: modelState, scene: modelScene, bbox: modelBbox } = useModelLoader(modelConfig)
  const hasModel = modelState === 'loaded' && !!modelScene

  const layout = useWorkspaceLayout({ hasModel })
  const placement = usePointPlacement({ prefix: 'V' })

  // Report generation (replaces inline fetch + unclean setInterval)
  const { reportDownloadUrl, isGeneratingReport, generateReport: handleGenerateReport } = useReportGeneration({
    sessionId,
    analysisType: 'view',
    results,
  })

  // 분석 완료 시 패널 전환
  useEffect(() => {
    if (phase === 'completed' && results) {
      layout.setActivePanelTab('results')
      layout.setSidePanelOpen(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, results])

  // Browser tab title
  useEffect(() => {
    if (phase === 'polling' && progress) {
      document.title = `[${progress.overall_progress}%] 조망 분석 - BoLumiCloud`
    } else if (phase === 'completed') {
      document.title = '[완료] 조망 분석 - BoLumiCloud'
    } else {
      document.title = '조망 분석 - BoLumiCloud'
    }
    return () => { document.title = 'BoLumiCloud' }
  }, [phase, progress])

  const handleFileSelect = useCallback(async (file: File) => {
    await uploadFile(file)
  }, [uploadFile])

  const handleConfigChange = useCallback((partial: Partial<ViewConfigState>) => {
    setConfig((prev) => ({ ...prev, ...partial }))
  }, [])

  const handleStartAnalysis = useCallback(async () => {
    const observerPoints = placement.points.map((p) => ({
      id: p.id,
      x: p.position.x,
      y: p.position.y,
      z: p.position.z,
      name: p.name,
      normal_dx: p.normal?.dx,
      normal_dy: p.normal?.dy,
      normal_dz: p.normal?.dz,
    }))

    const analysisConfig: ViewConfig = {
      latitude: config.latitude,
      longitude: config.longitude,
      hemisphere_resolution: config.hemisphereResolution,
      projection_type: config.projectionType,
      observer_points: observerPoints,
      landscape_categories: {},
    }
    await runAnalysis(analysisConfig)
  }, [config, runAnalysis, placement.points])

  const statusBarState = useMemo((): StatusBarState => {
    if (error) return 'error'
    if (phase === 'uploading') return 'uploading'
    if (phase === 'running' || phase === 'polling') return 'running'
    if (phase === 'completed') return 'completed'
    return 'idle'
  }, [phase, error])

  const isRunning = phase === 'running' || phase === 'polling'

  // Undo/Redo keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) placement.redo()
        else placement.undo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [placement.undo, placement.redo])

  return (
    <AnalysisWorkspace
      toolbar={
        hasModel ? (
          <WorkspaceToolbar
            modes={VIEW_TOOLBAR_MODES}
            activeMode={placement.mode}
            onModeChange={placement.setMode}
            pointCount={placement.points.length}
            onClearAll={placement.clearPoints}
            extraControls={
              <div className="flex items-center gap-0.5 ml-1">
                <div className="w-px h-5 bg-gray-200" />
                <button
                  onClick={placement.undo}
                  disabled={!placement.canUndo}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors rounded"
                  title="실행 취소 (Ctrl+Z)"
                >
                  <Undo2 size={14} />
                </button>
                <button
                  onClick={placement.redo}
                  disabled={!placement.canRedo}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors rounded"
                  title="다시 실행 (Ctrl+Shift+Z)"
                >
                  <Redo2 size={14} />
                </button>
              </div>
            }
          />
        ) : undefined
      }
      sidePanel={
        <ViewSidePanel
          open={layout.sidePanelOpen}
          onClose={layout.closePanel}
          onOpen={() => layout.openPanel()}
          config={config}
          onConfigChange={handleConfigChange}
          disabled={isRunning}
          points={placement.points}
          selectedPointId={placement.selectedPointId}
          onPointSelect={placement.selectPoint}
          isRunning={isRunning}
          onStartAnalysis={handleStartAnalysis}
          results={results}
          onGenerateReport={handleGenerateReport}
          reportDownloadUrl={reportDownloadUrl}
          isGeneratingReport={isGeneratingReport}
        />
      }
      statusBar={
        <WorkspaceStatusBar
          state={statusBarState}
          modelInfo={modelMeta ? `${modelMeta.original_name} | V: ${modelMeta.vertices.toLocaleString()}` : undefined}
          stageName={progress?.stages.find((s) => s.status === 'processing')?.name}
          analysisProgress={progress?.overall_progress}
          etaText={estimatedRemainingSec ? formatEta(estimatedRemainingSec) : undefined}
          completionTime={results ? formatDuration(results.metadata.computation_time_sec) : undefined}
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
          />
        ) : undefined
      }
    >
      <WorkspaceViewport bbox={modelBbox} orbitEnabled={placement.mode === 'navigate'}>
        <SceneLighting />
        {modelScene && (
          <InteractiveBuildingModel
            scene={modelScene}
            bbox={modelBbox}
            interactionEnabled={placement.mode === 'place_point'}
            allowedSurfaces={['wall', 'roof']}
            onSurfaceHover={placement.setHoverHit}
            onSurfaceClick={placement.handleSurfaceClick}
          />
        )}
        <GroundGrid bbox={modelBbox} />
        <CompassRose bbox={modelBbox} />
        <SurfaceHighlight hit={placement.hoverHit} />
        {placement.points.map((point) => (
          <PointMarker3D
            key={point.id}
            point={point}
            visualType="disc"
            isSelected={point.id === placement.selectedPointId}
            color="#60a5fa"
            onClick={() => placement.handlePointClick(point.id)}
          />
        ))}
      </WorkspaceViewport>

      {/* Keyboard shortcut help overlay */}
      {layout.isShortcutOverlayVisible && (
        <KeyboardShortcutOverlay
          modes={VIEW_TOOLBAR_MODES}
          onClose={layout.closeShortcutOverlay}
        />
      )}
    </AnalysisWorkspace>
  )
}
