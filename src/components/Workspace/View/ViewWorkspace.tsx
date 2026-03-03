'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useViewPipelineContext } from '@/contexts/ViewPipelineContext'
import { useApi } from '@/contexts/ApiContext'
import { useModelLoader } from '@/components/shared/3d/useModelLoader'
import { usePointPlacement } from '@/components/shared/3d/interaction/usePointPlacement'
import { useWorkspaceLayout } from '../hooks/useWorkspaceLayout'
import type { ViewConfig, ViewConfigState } from '@/lib/types/view'
import type { ModelConfig } from '@/components/shared/3d/types'
import type { StatusBarState } from '../WorkspaceStatusBar'

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

// ─── 기본 설정 ─────────────────────────────
const DEFAULT_CONFIG: ViewConfigState = {
  latitude: 37.5665,
  longitude: 126.978,
  timezone: 135,
  hemisphereResolution: 180,
  projectionType: 'equidistant',
}

function formatEta(sec: number): string {
  const minutes = Math.floor(sec / 60)
  const seconds = sec % 60
  if (minutes > 0) return `${minutes}분 ${seconds}초`
  return `${seconds}초`
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec.toFixed(1)}s`
  return `${Math.floor(sec / 60)}m ${(sec % 60).toFixed(0)}s`
}

export default function ViewWorkspace() {
  const { apiUrl } = useApi()
  const pipeline = useViewPipelineContext()
  const {
    phase, sessionId, sceneUrl, modelMeta,
    progress, results, error, estimatedRemainingSec,
    uploadFile, runAnalysis,
  } = pipeline

  const [config, setConfig] = useState<ViewConfigState>({ ...DEFAULT_CONFIG })

  // 3D model
  const modelConfig: ModelConfig | null = sceneUrl
    ? { url: sceneUrl, format: 'glb', autoCenter: true, zUp: false }
    : null
  const { state: modelState, scene: modelScene, bbox: modelBbox } = useModelLoader(modelConfig)
  const hasModel = modelState === 'loaded' && !!modelScene

  const layout = useWorkspaceLayout({ hasModel })
  const placement = usePointPlacement({ prefix: 'V' })

  // Report state
  const [reportDownloadUrl, setReportDownloadUrl] = useState<string | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

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

  const handleGenerateReport = useCallback(async () => {
    if (!sessionId || !results) return
    setIsGeneratingReport(true)
    try {
      const res = await fetch(`${apiUrl}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_type: 'view',
          session_id: sessionId,
          analysis_result: results,
        }),
      })
      if (!res.ok) throw new Error('보고서 생성 실패')
      const data = await res.json()
      const rid = data.report_id

      const poll = setInterval(async () => {
        const statusRes = await fetch(`${apiUrl}/reports/${rid}/status`)
        const status = await statusRes.json()
        if (status.status === 'completed') {
          clearInterval(poll)
          setIsGeneratingReport(false)
          setReportDownloadUrl(`${apiUrl}${status.download_url}`)
        } else if (status.status === 'error') {
          clearInterval(poll)
          setIsGeneratingReport(false)
        }
      }, 2000)
    } catch {
      setIsGeneratingReport(false)
    }
  }, [apiUrl, sessionId, results])

  const statusBarState = useMemo((): StatusBarState => {
    if (error) return 'error'
    if (phase === 'uploading') return 'uploading'
    if (phase === 'running' || phase === 'polling') return 'running'
    if (phase === 'completed') return 'completed'
    return 'idle'
  }, [phase, error])

  const isRunning = phase === 'running' || phase === 'polling'

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
