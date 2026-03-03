'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useSunlightPipelineContext } from '@/contexts/SunlightPipelineContext'
import { useApi } from '@/contexts/ApiContext'
import { useModelLoader } from '@/components/shared/3d/useModelLoader'
import { usePointPlacement } from '@/components/shared/3d/interaction/usePointPlacement'
import { useAreaPlacement } from '@/components/shared/3d/interaction/useAreaPlacement'
import { useShadowAnimation } from '@/components/SunlightAnalysis/hooks/useShadowAnimation'
import { useWorkspaceLayout } from '../hooks/useWorkspaceLayout'
import { SUNLIGHT_DATE_PRESETS, DEFAULT_TOTAL_THRESHOLD, DEFAULT_CONTINUOUS_THRESHOLD } from '@/lib/types/sunlight'
import { usePointGroups } from './hooks/usePointGroups'
import type { SunlightConfig, SunlightConfigState, CauseAnalysisResult, GroundAnalysisResult, IsochroneLine, LayerConfig } from '@/lib/types/sunlight'
import type { ModelConfig } from '@/components/shared/3d/types'
import type { StatusBarState } from '../WorkspaceStatusBar'

import AnalysisWorkspace from '../AnalysisWorkspace'
import WorkspaceViewport from '../WorkspaceViewport'
import WorkspaceToolbar, { KeyboardShortcutOverlay } from '../WorkspaceToolbar'
import WorkspaceStatusBar from '../WorkspaceStatusBar'
import WorkspaceUploadOverlay from '../WorkspaceUploadOverlay'
import SunlightSidePanel from './SunlightSidePanel'
import SunlightShadowControls from './SunlightShadowControls'
import { SUNLIGHT_TOOLBAR_MODES } from './SunlightToolbarConfig'

// 3D components (dynamic import for SSR safety)
const SceneLighting = dynamic(() => import('@/components/shared/3d/SceneLighting'), { ssr: false })
const GroundGrid = dynamic(() => import('@/components/shared/3d/GroundGrid'), { ssr: false })
const CompassRose = dynamic(() => import('@/components/shared/3d/CompassRose'), { ssr: false })
const InteractiveBuildingModel = dynamic(() => import('@/components/shared/3d/interaction/InteractiveBuildingModel'), { ssr: false })
const InteractiveGround = dynamic(() => import('@/components/shared/3d/interaction/InteractiveGround'), { ssr: false })
const SurfaceHighlight = dynamic(() => import('@/components/shared/3d/interaction/SurfaceHighlight'), { ssr: false })
const PointMarker3D = dynamic(() => import('@/components/shared/3d/interaction/PointMarker3D'), { ssr: false })
const AreaGridPreview = dynamic(() => import('@/components/shared/3d/interaction/AreaGridPreview'), { ssr: false })
const SunlightHeatmapOverlay = dynamic(() => import('@/components/SunlightAnalysis/3d/SunlightHeatmapOverlay'), { ssr: false })
const ShadowOverlay = dynamic(() => import('@/components/SunlightAnalysis/3d/ShadowOverlay'), { ssr: false })
const SunPositionIndicator = dynamic(() => import('@/components/SunlightAnalysis/3d/SunPositionIndicator'), { ssr: false })
const ViolationHighlight = dynamic(() => import('@/components/SunlightAnalysis/3d/ViolationHighlight'), { ssr: false })
const ModelTransformControls = dynamic(() => import('@/components/shared/3d/interaction/ModelTransformControls'), { ssr: false })
const GroundHeatmap = dynamic(() => import('@/components/SunlightAnalysis/3d/GroundHeatmap'), { ssr: false })
const ContourLines = dynamic(() => import('@/components/SunlightAnalysis/3d/ContourLines'), { ssr: false })

import SunlightLegend from '@/components/SunlightAnalysis/3d/SunlightLegend'
import { Undo2, Redo2 } from 'lucide-react'

// ─── 기본 설정 ─────────────────────────────
const DEFAULT_CONFIG: SunlightConfigState = {
  latitude: 37.5665,
  longitude: 126.978,
  timezone: 135,
  azimuth: 0,
  date: SUNLIGHT_DATE_PRESETS[0],
  buildingType: 'apartment',
  resolution: 'legal',
  solarTimeMode: 'true_solar',
  totalThreshold: { ...DEFAULT_TOTAL_THRESHOLD },
  continuousThreshold: { ...DEFAULT_CONTINUOUS_THRESHOLD },
}

function formatEta(sec: number): string {
  const minutes = Math.floor(sec / 60)
  const seconds = sec % 60
  if (minutes > 0) return `${minutes}분 ${seconds}초`
  return `${seconds}초`
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec.toFixed(1)}s`
  const min = Math.floor(sec / 60)
  return `${min}m ${(sec % 60).toFixed(0)}s`
}

// ─── 컴포넌트 ─────────────────────────────
export default function SunlightWorkspace() {
  const { apiUrl } = useApi()
  const pipeline = useSunlightPipelineContext()
  const {
    phase,
    sessionId,
    sceneUrl,
    modelMeta,
    progress,
    results,
    error,
    estimatedRemainingSec,
    importData,
    uploadFile,
    runAnalysis,
  } = pipeline

  // Config state
  const [config, setConfig] = useState<SunlightConfigState>({ ...DEFAULT_CONFIG })

  // 3D model
  const modelConfig: ModelConfig | null = sceneUrl
    ? { url: sceneUrl, format: 'glb', autoCenter: true, zUp: false }
    : null
  const { state: modelState, scene: modelScene, bbox: modelBbox } = useModelLoader(modelConfig)
  const hasModel = modelState === 'loaded' && !!modelScene

  // Transform controls
  const [transformMode] = useState<'translate' | 'rotate'>('translate')

  // Layout
  const layout = useWorkspaceLayout({ hasModel })

  // Placement
  const placement = usePointPlacement({ prefix: 'P' })
  const areaPlacement = useAreaPlacement('G')

  // Point groups
  const pointGroups = usePointGroups()

  // SN5F 임포트 데이터 자동 적용
  useEffect(() => {
    if (!importData) return

    // 분석 조건 자동 채우기
    if (importData.conditions) {
      const c = importData.conditions
      setConfig(prev => ({
        ...prev,
        latitude: c.latitude,
        longitude: c.longitude,
        azimuth: c.azimuth,
        date: { month: c.month, day: c.day, label: `${c.month}/${c.day}` },
        solarTimeMode: c.solarTimeMode,
        ...(c.continuousStart != null && c.continuousEnd != null ? {
          continuousThreshold: {
            startHour: c.continuousStart,
            endHour: c.continuousEnd,
            requiredHours: c.continuousThresholdHour || 2,
          }
        } : {}),
        ...(c.totalStart != null && c.totalEnd != null ? {
          totalThreshold: {
            startHour: c.totalStart,
            endHour: c.totalEnd,
            requiredHours: c.totalThresholdHour || 4,
          }
        } : {}),
      }))
    }

    // 측정점 그룹 임포트
    if (importData.measurementGroups.length > 0) {
      const groupsData = importData.measurementGroups.map(g => ({
        groupName: g.groupName,
        points: g.points.map(p => ({
          id: p.id,
          x: p.x,
          y: p.y,
          z: p.z,
          name: p.name,
        })),
      }))
      pointGroups.importGroups(groupsData)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importData])

  // Shadow animation
  const shadow = useShadowAnimation({ apiUrl })

  // Cause analysis
  const [causeResult, setCauseResult] = useState<CauseAnalysisResult | null>(null)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)

  // Ground analysis state
  const [groundResult, setGroundResult] = useState<GroundAnalysisResult | null>(null)
  const [groundIsochrones, setGroundIsochrones] = useState<IsochroneLine[]>([])
  const [showGroundHeatmap, setShowGroundHeatmap] = useState(false)
  const [isGroundAnalyzing, setIsGroundAnalyzing] = useState(false)

  // Layer management
  const [layers, setLayers] = useState<LayerConfig[]>([])

  // Initialize layers from importData groups
  useEffect(() => {
    if (!importData?.groups || importData.groups.length === 0) return
    const LAYER_COLORS = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316']
    setLayers(importData.groups.map((g, i) => ({
      id: g.name,
      name: g.name,
      visible: g.visible ?? true,
      isAnalysisTarget: true,
      color: g.color || LAYER_COLORS[i % LAYER_COLORS.length],
      vertexCount: g.vertexCount,
      faceCount: g.faceCount,
    })))
  }, [importData?.groups])

  const handleToggleLayerVisibility = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l))
  }, [])

  const handleToggleAnalysisTarget = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, isAnalysisTarget: !l.isAnalysisTarget } : l))
  }, [])

  const handleToggleAllLayers = useCallback((visible: boolean) => {
    setLayers(prev => prev.map(l => ({ ...l, visible })))
  }, [])

  // Report state
  const [reportDownloadUrl, setReportDownloadUrl] = useState<string | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // Polling interval refs for cleanup
  const reportPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const groundPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      if (reportPollRef.current) clearInterval(reportPollRef.current)
      if (groundPollRef.current) clearInterval(groundPollRef.current)
    }
  }, [])

  // 포인트 변경 시 활성 그룹에 동기화
  useEffect(() => {
    pointGroups.syncPointsToGroup(placement.points)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement.points])

  // ── 자동 그림자 계산 (분석 완료 시) ──
  useEffect(() => {
    if (phase === 'completed' && results && sessionId && shadow.frames.length === 0 && !shadow.isComputing) {
      shadow.computeShadows({
        sessionId,
        latitude: config.latitude,
        longitude: config.longitude,
        month: config.date.month,
        day: config.date.day,
        timezoneOffset: config.timezone / 15,
        stepMinutes: 10,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, results, sessionId])

  // 분석 완료 시 패널 탭 전환
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
      document.title = `[${progress.overall_progress}%] 일조 분석 - BoLumiCloud`
    } else if (phase === 'completed') {
      document.title = '[완료] 일조 분석 - BoLumiCloud'
    } else {
      document.title = '일조 분석 - BoLumiCloud'
    }
    return () => { document.title = 'BoLumiCloud' }
  }, [phase, progress])

  // ── Handlers ──
  const handleFileSelect = useCallback(async (file: File) => {
    await uploadFile(file)
  }, [uploadFile])

  const handleConfigChange = useCallback((partial: Partial<SunlightConfigState>) => {
    setConfig((prev) => ({ ...prev, ...partial }))
  }, [])

  const handleStartAnalysis = useCallback(async () => {
    // 그룹의 모든 포인트를 사용 (행/열 정보 포함)
    const measurementPoints = pointGroups.allMeasurementPoints.map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      z: p.z,
      name: p.name,
      group: p.group,
      row: p.row,
      column: p.column,
    }))

    const analysisConfig: SunlightConfig = {
      latitude: config.latitude,
      longitude: config.longitude,
      timezone_offset: config.timezone / 15,
      standard_meridian: config.timezone,
      azimuth: config.azimuth,
      month: config.date.month,
      day: config.date.day,
      date_label: config.date.label,
      building_type: config.buildingType,
      time_start: `${String(config.totalThreshold.startHour).padStart(2, '0')}:00`,
      time_end: `${String(config.totalThreshold.endHour).padStart(2, '0')}:00`,
      continuous_start: `${String(config.continuousThreshold.startHour).padStart(2, '0')}:00`,
      continuous_end: `${String(config.continuousThreshold.endHour).padStart(2, '0')}:00`,
      total_required_hours: config.totalThreshold.requiredHours,
      continuous_required_hours: config.continuousThreshold.requiredHours,
      resolution: config.resolution,
      solar_time_mode: config.solarTimeMode,
      measurement_points: measurementPoints,
    }
    await runAnalysis(analysisConfig)
  }, [config, runAnalysis, pointGroups.allMeasurementPoints])

  const handleGenerateReport = useCallback(async () => {
    if (!sessionId || !results) return
    setIsGeneratingReport(true)
    try {
      const res = await fetch(`${apiUrl}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          latitude: config.latitude,
          longitude: config.longitude,
          timezone_offset: config.timezone / 15,
          month: config.date.month,
          day: config.date.day,
          building_type: config.buildingType,
          analysis_result: results,
        }),
      })
      if (!res.ok) throw new Error('보고서 생성 실패')
      const data = await res.json()
      const rid = data.report_id

      // Poll for completion
      if (reportPollRef.current) clearInterval(reportPollRef.current)
      reportPollRef.current = setInterval(async () => {
        const statusRes = await fetch(`${apiUrl}/reports/${rid}/status`)
        const status = await statusRes.json()
        if (status.status === 'completed') {
          clearInterval(reportPollRef.current!)
          reportPollRef.current = null
          setIsGeneratingReport(false)
          setReportDownloadUrl(`${apiUrl}${status.download_url}`)
          if (status.cause_analysis) setCauseResult(status.cause_analysis)
        } else if (status.status === 'error') {
          clearInterval(reportPollRef.current!)
          reportPollRef.current = null
          setIsGeneratingReport(false)
        }
      }, 2000)
    } catch {
      setIsGeneratingReport(false)
    }
  }, [apiUrl, sessionId, results, config])

  // ── Ground analysis handler ──
  const handleGroundAnalysis = useCallback(async () => {
    if (!sessionId) return
    setIsGroundAnalyzing(true)
    setShowGroundHeatmap(true)
    try {
      const res = await fetch(`${apiUrl}/sunlight/ground-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          grid_size: 2.0,
          altitude: 0.0,
          latitude: config.latitude,
          longitude: config.longitude,
          timezone_offset: config.timezone / 15,
          month: config.date.month,
          day: config.date.day,
          resolution: 'preview',
        }),
      })
      if (!res.ok) throw new Error('지반일조 분석 요청 실패')
      const data = await res.json()
      const groundId = data.ground_id

      // Poll for completion
      if (groundPollRef.current) clearInterval(groundPollRef.current)
      groundPollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`${apiUrl}/sunlight/ground/${groundId}/status`)
          const status = await statusRes.json()
          if (status.status === 'completed') {
            clearInterval(groundPollRef.current!)
            groundPollRef.current = null
            // Fetch result
            const resultRes = await fetch(`${apiUrl}/sunlight/ground/${groundId}/result`)
            const result = await resultRes.json()
            setGroundResult(result)
            // Fetch isochrones
            const isoRes = await fetch(`${apiUrl}/sunlight/ground/${groundId}/isochrones`)
            const isoData = await isoRes.json()
            setGroundIsochrones(isoData.isochrones || [])
            setIsGroundAnalyzing(false)
          } else if (status.status === 'error') {
            clearInterval(groundPollRef.current!)
            groundPollRef.current = null
            setIsGroundAnalyzing(false)
          }
        } catch {
          clearInterval(groundPollRef.current!)
          groundPollRef.current = null
          setIsGroundAnalyzing(false)
        }
      }, 2000)
    } catch {
      setIsGroundAnalyzing(false)
    }
  }, [apiUrl, sessionId, config])

  // ── Status bar state ──
  const statusBarState = useMemo((): StatusBarState => {
    if (error) return 'error'
    if (phase === 'uploading') return 'uploading'
    if (phase === 'running' || phase === 'polling') return 'running'
    if (phase === 'completed') return 'completed'
    return 'idle'
  }, [phase, error])

  const statusModelInfo = modelMeta
    ? `${modelMeta.original_name} | V: ${modelMeta.vertices.toLocaleString()} F: ${modelMeta.faces.toLocaleString()}`
    : undefined

  const statusStageName = progress?.stages.find((s) => s.status === 'processing')?.name

  // ── Sun direction for SceneLighting ──
  const sunDirection = useMemo((): [number, number, number] => {
    if (!shadow.currentFrame || shadow.currentFrame.solar_altitude <= 0) {
      return [50, 80, 30]
    }
    const altRad = (shadow.currentFrame.solar_altitude * Math.PI) / 180
    const aziRad = (shadow.currentFrame.solar_azimuth * Math.PI) / 180
    return [
      Math.cos(altRad) * Math.sin(aziRad) * 100,
      Math.sin(altRad) * 100,
      Math.cos(altRad) * Math.cos(aziRad) * 100,
    ]
  }, [shadow.currentFrame])

  const solarPosition = shadow.currentFrame
    ? { altitude: shadow.currentFrame.solar_altitude, azimuth: shadow.currentFrame.solar_azimuth }
    : null

  const isRunning = phase === 'running' || phase === 'polling'

  // Undo/Redo keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          placement.redo()
        } else {
          placement.undo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [placement])

  return (
    <AnalysisWorkspace
      toolbar={
        hasModel ? (
          <WorkspaceToolbar
            modes={SUNLIGHT_TOOLBAR_MODES}
            activeMode={placement.mode}
            onModeChange={(m) => {
              placement.setMode(m)
              if (m !== 'place_area') areaPlacement.resetArea()
            }}
            pointCount={placement.points.length}
            onClearAll={() => {
              placement.clearPoints()
              areaPlacement.resetArea()
            }}
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
        <SunlightSidePanel
          open={layout.sidePanelOpen}
          onClose={layout.closePanel}
          onOpen={() => layout.openPanel()}
          config={config}
          onConfigChange={handleConfigChange}
          disabled={isRunning}
          points={placement.points}
          selectedPointId={placement.selectedPointId}
          onPointSelect={placement.selectPoint}
          groups={pointGroups.groups}
          activeGroupId={pointGroups.activeGroupId}
          onAddGroup={pointGroups.addGroup}
          onRemoveGroup={pointGroups.removeGroup}
          onRenameGroup={pointGroups.renameGroup}
          onSetActiveGroup={pointGroups.setActiveGroup}
          onSortGroup={pointGroups.sortGroup}
          onToggleReverseColumns={pointGroups.toggleReverseColumns}
          isRunning={isRunning}
          onStartAnalysis={handleStartAnalysis}
          results={results}
          onGenerateReport={handleGenerateReport}
          reportDownloadUrl={reportDownloadUrl}
          isGeneratingReport={isGeneratingReport}
          causeResult={causeResult}
          selectedBuildingId={selectedBuildingId}
          onBuildingSelect={setSelectedBuildingId}
          onStartGroundAnalysis={handleGroundAnalysis}
          isGroundAnalysisRunning={isGroundAnalyzing}
          apiUrl={apiUrl}
          sessionId={sessionId}
          layers={layers}
          onToggleLayerVisibility={handleToggleLayerVisibility}
          onToggleAnalysisTarget={handleToggleAnalysisTarget}
          onToggleAllLayers={handleToggleAllLayers}
        />
      }
      bottomControls={
        shadow.frames.length > 0 ? (
          <SunlightShadowControls
            playback={shadow.playback}
            maxMinute={shadow.frames.length > 0 ? shadow.frames[shadow.frames.length - 1].minute : 479}
            stepSize={shadow.frames.length > 1 ? shadow.frames[1].minute - shadow.frames[0].minute : 10}
            onMinuteChange={shadow.setCurrentMinute}
            onPlay={shadow.play}
            onPause={shadow.pause}
            onSpeedChange={shadow.setSpeed}
          />
        ) : undefined
      }
      statusBar={
        <WorkspaceStatusBar
          state={statusBarState}
          modelInfo={statusModelInfo}
          stageName={statusStageName}
          analysisProgress={progress?.overall_progress}
          etaText={estimatedRemainingSec ? formatEta(estimatedRemainingSec) : undefined}
          completionTime={results ? `${formatDuration(results.metadata.computation_time_sec)}` : undefined}
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
      {/* ── 3D Viewport ── */}
      <WorkspaceViewport
        bbox={modelBbox}
        orbitEnabled={placement.mode === 'navigate'}
      >
        <SceneLighting sunDirection={shadow.frames.length > 0 ? sunDirection : undefined} />

        {/* Building model (interactive when placing points) */}
        {modelScene && (
          <InteractiveBuildingModel
            scene={modelScene}
            bbox={modelBbox}
            interactionEnabled={placement.mode === 'place_point'}
            onSurfaceHover={placement.setHoverHit}
            onSurfaceClick={placement.handleSurfaceClick}
            groups={importData?.groups}
          />
        )}

        {/* Transform controls */}
        {placement.mode === 'transform' && modelScene && (
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
        )}

        {/* Grid & compass */}
        <GroundGrid bbox={modelBbox} />
        <CompassRose bbox={modelBbox} />

        {/* Surface hover highlight */}
        {placement.mode !== 'place_area' && (
          <SurfaceHighlight hit={placement.hoverHit} />
        )}

        {/* Area grid preview */}
        <AreaGridPreview
          firstCorner={areaPlacement.firstCorner}
          previewCorner={areaPlacement.previewCorner}
          area={areaPlacement.area}
          gridSpacing={areaPlacement.gridSpacing}
          gridPointCount={areaPlacement.gridPoints.length}
        />

        {/* Point markers */}
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

        {/* Shadow overlay */}
        {shadow.frames.length > 0 && (
          <>
            <ShadowOverlay frame={shadow.currentFrame} />
            <SunPositionIndicator solarPosition={solarPosition} />
          </>
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
            points={placement.points.length > 0
              ? placement.points.map((p) => ({ id: p.id, x: p.position.x, y: p.position.y, z: p.position.z, name: p.name }))
              : results.points.map((p) => ({ id: p.id, x: p.x, y: p.y, z: p.z, name: p.name }))
            }
            results={results.points}
            selectedPointId={placement.selectedPointId}
            onPointClick={placement.selectPoint}
          />
        )}

        {/* Violation highlight (cause analysis) */}
        {causeResult && causeResult.point_causes.length > 0 && (
          <ViolationHighlight
            blockers={causeResult.point_causes.flatMap((pc) => pc.blockers)}
            selectedBuildingId={selectedBuildingId}
          />
        )}
      </WorkspaceViewport>

      {/* Legend overlay */}
      {results && results.points.length > 0 && (
        <div className="absolute bottom-16 left-3 z-10">
          <SunlightLegend />
        </div>
      )}

      {/* Keyboard shortcut help overlay */}
      {layout.isShortcutOverlayVisible && (
        <KeyboardShortcutOverlay
          modes={SUNLIGHT_TOOLBAR_MODES}
          onClose={layout.closeShortcutOverlay}
        />
      )}
    </AnalysisWorkspace>
  )
}
