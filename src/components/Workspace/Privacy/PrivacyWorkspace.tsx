'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { usePrivacyPipelineContext } from '@/contexts/PrivacyPipelineContext'
import { useModelLoader } from '@/components/shared/3d/useModelLoader'
import { usePointPlacement } from '@/components/shared/3d/interaction/usePointPlacement'
import { useWorkspaceLayout } from '../hooks/useWorkspaceLayout'
import { usePrivacySingleUpload } from './hooks/usePrivacySingleUpload'
import { useReportGeneration } from '@/hooks/useReportGeneration'
import type { WindowSpec } from '@/lib/types/privacy'
import type { ModelConfig } from '@/components/shared/3d/types'
import type { StatusBarState } from '../WorkspaceStatusBar'
import { Undo2, Redo2 } from 'lucide-react'

import AnalysisWorkspace from '../AnalysisWorkspace'
import WorkspaceViewport from '../WorkspaceViewport'
import WorkspaceToolbar, { KeyboardShortcutOverlay } from '../WorkspaceToolbar'
import WorkspaceStatusBar from '../WorkspaceStatusBar'
import WorkspaceUploadOverlay from '../WorkspaceUploadOverlay'
import PrivacySidePanel from './PrivacySidePanel'
import { PRIVACY_TOOLBAR_MODES } from './PrivacyToolbarConfig'

const SceneLighting = dynamic(() => import('@/components/shared/3d/SceneLighting'), { ssr: false })
const GroundGrid = dynamic(() => import('@/components/shared/3d/GroundGrid'), { ssr: false })
const CompassRose = dynamic(() => import('@/components/shared/3d/CompassRose'), { ssr: false })
const InteractiveBuildingModel = dynamic(() => import('@/components/shared/3d/interaction/InteractiveBuildingModel'), { ssr: false })
const SurfaceHighlight = dynamic(() => import('@/components/shared/3d/interaction/SurfaceHighlight'), { ssr: false })
const PointMarker3D = dynamic(() => import('@/components/shared/3d/interaction/PointMarker3D'), { ssr: false })
const SightlineVisualization = dynamic(() => import('@/components/PrivacyAnalysis/3d/SightlineVisualization'), { ssr: false })
const WindowMarkers = dynamic(() => import('@/components/PrivacyAnalysis/3d/WindowMarkers'), { ssr: false })

export default function PrivacyWorkspace() {
  const pipeline = usePrivacyPipelineContext()
  const { uploadSingle } = usePrivacySingleUpload(pipeline)
  const {
    phase, sessionId, sceneUrl,
    config, progress, results, error,
    setConfig, run, cancel, reset,
  } = pipeline

  // Active role: target (orange) vs observer (blue)
  const [activeRole, setActiveRole] = useState<'target' | 'observer'>('target')

  // 3D model (single upload → one scene)
  const modelConfig = useMemo<ModelConfig | null>(() =>
    sceneUrl ? { url: sceneUrl, format: 'glb', autoCenter: true, zUp: false } : null,
    [sceneUrl]
  )
  const { state: modelState, scene: modelScene, bbox: modelBbox } = useModelLoader(modelConfig)
  const hasModel = modelState === 'loaded' && !!modelScene

  const layout = useWorkspaceLayout({ hasModel })
  const placement = usePointPlacement({ prefix: activeRole === 'target' ? 'TW' : 'OW' })

  // Report generation (replaces inline fetch + unclean setInterval)
  const { reportDownloadUrl, isGeneratingReport, generateReport: handleGenerateReport } = useReportGeneration({
    sessionId,
    analysisType: 'privacy',
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

  // 포인트 → 창문 동기화: 포인트가 추가되면 WindowSpec으로 변환하여 config에 반영
  useEffect(() => {
    const windows: WindowSpec[] = placement.points.map((p) => ({
      id: p.id,
      x: p.position.x,
      y: p.position.y,
      z: p.position.z,
      normal_dx: p.normal?.dx ?? 0,
      normal_dy: p.normal?.dy ?? 0,
      normal_dz: p.normal?.dz ?? 1,
      width: 1.5, // default
      height: 1.5,
      building_name: 'Building',
      floor: Math.max(1, Math.round(p.position.z / 3)),
    }))

    if (activeRole === 'target') {
      setConfig({ targetWindows: windows })
    } else {
      setConfig({ observerWindows: windows })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement.points, activeRole])

  const handleFileSelect = useCallback(async (file: File) => {
    await uploadSingle(file)
  }, [uploadSingle])

  const handleStartAnalysis = useCallback(async () => {
    await run()
  }, [run])

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

  // Role toggle extra control for toolbar
  const roleToggle = (
    <>
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <button
        onClick={() => setActiveRole('target')}
        className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
          activeRole === 'target'
            ? 'bg-orange-500 text-white shadow-sm'
            : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
        }`}
      >
        대상
      </button>
      <button
        onClick={() => setActiveRole('observer')}
        className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
          activeRole === 'observer'
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
        }`}
      >
        관찰
      </button>
    </>
  )

  return (
    <AnalysisWorkspace
      toolbar={
        hasModel ? (
          <WorkspaceToolbar
            modes={PRIVACY_TOOLBAR_MODES}
            activeMode={placement.mode}
            onModeChange={placement.setMode}
            pointCount={config.targetWindows.length + config.observerWindows.length}
            onClearAll={placement.clearPoints}
            extraControls={
              <>
                {roleToggle}
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
              </>
            }
          />
        ) : undefined
      }
      sidePanel={
        <PrivacySidePanel
          open={layout.sidePanelOpen}
          onClose={layout.closePanel}
          onOpen={() => layout.openPanel()}
          config={config}
          onConfigChange={setConfig}
          disabled={isRunning}
          activeRole={activeRole}
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
          stageName={progress?.stages.find((s) => s.status === 'processing')?.name}
          analysisProgress={progress?.overall_progress}
          completionTime={results ? `${results.metadata.computation_time_sec.toFixed(1)}s` : undefined}
          errorMessage={error || undefined}
          message={hasModel
            ? `대상: ${config.targetWindows.length} | 관찰: ${config.observerWindows.length}`
            : undefined}
          onViewResults={() => {
            layout.setActivePanelTab('results')
            layout.setSidePanelOpen(true)
          }}
          onRetry={handleStartAnalysis}
          onReset={reset}
          onCancel={cancel}
        />
      }
      uploadOverlay={
        layout.isUploadOverlayVisible && !hasModel ? (
          <WorkspaceUploadOverlay
            onFileSelect={handleFileSelect}
            isUploading={phase === 'uploading'}
            hint=".obj 파일 (대상+관찰 건물 포함된 단일 모델)"
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
            allowedSurfaces={['wall']}
            onSurfaceHover={placement.setHoverHit}
            onSurfaceClick={placement.handleSurfaceClick}
          />
        )}
        <GroundGrid bbox={modelBbox} />
        <CompassRose bbox={modelBbox} />
        <SurfaceHighlight hit={placement.hoverHit} />

        {/* Window markers from config */}
        {(config.targetWindows.length > 0 || config.observerWindows.length > 0) && (
          <WindowMarkers
            targetWindows={config.targetWindows}
            observerWindows={config.observerWindows}
            selectedWindowId={placement.selectedPointId}
            onWindowClick={placement.selectPoint}
          />
        )}

        {/* Current placement points */}
        {placement.points.map((point) => (
          <PointMarker3D
            key={point.id}
            point={point}
            visualType="disc"
            isSelected={point.id === placement.selectedPointId}
            color={activeRole === 'target' ? '#f97316' : '#3b82f6'}
            onClick={() => placement.handlePointClick(point.id)}
          />
        ))}

        {/* Sightline visualization (results) */}
        {results && results.pairs.length > 0 && (
          <SightlineVisualization
            pairs={results.pairs}
            gradeFilter={{ 1: true, 2: true, 3: true }}
            selectedPairId={null}
            onPairSelect={() => {}}
          />
        )}
      </WorkspaceViewport>

      {/* Keyboard shortcut help overlay */}
      {layout.isShortcutOverlayVisible && (
        <KeyboardShortcutOverlay
          modes={PRIVACY_TOOLBAR_MODES}
          onClose={layout.closeShortcutOverlay}
        />
      )}
    </AnalysisWorkspace>
  )
}
