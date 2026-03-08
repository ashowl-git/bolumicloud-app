'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useSunlightPipelineContext } from '@/contexts/SunlightPipelineContext'
import { useApi } from '@/contexts/ApiContext'
import { useModelLoader } from '@/components/shared/3d/useModelLoader'
import { usePointPlacement } from '@/components/shared/3d/interaction/usePointPlacement'
import { useAreaPlacement } from '@/components/shared/3d/interaction/useAreaPlacement'
import { useShadowAnimation } from '@/components/SunlightAnalysis/hooks/useShadowAnimation'
import { useWorkspaceLayout } from '../hooks/useWorkspaceLayout'
import { usePointGroups } from './hooks/usePointGroups'
import { useReportGeneration } from '@/hooks/useReportGeneration'
import { useGroundAnalysis } from '@/hooks/useGroundAnalysis'
import { useSolarChart3D } from '@/hooks/useSolarChart3D'
import type { SunlightConfig, SunlightConfigState, LayerConfig } from '@/lib/types/sunlight'
import type { ModelConfig, CameraPresetId } from '@/components/shared/3d/types'
import { DEFAULT_SUNLIGHT_CONFIG } from '@/lib/defaults/sunlight'
import { formatDuration, formatEta } from '@/lib/utils/format'
import { useStatusBarState } from '@/hooks/useStatusBarState'
import { useSunDirection, useSunriseSunset } from '@/hooks/useSunDirection'

import { useToast } from '@/contexts/ToastContext'
import AnalysisWorkspace from '../AnalysisWorkspace'
import WorkspaceViewport from '../WorkspaceViewport'
import WorkspaceToolbar, { KeyboardShortcutOverlay } from '../WorkspaceToolbar'
import WorkspaceStatusBar from '../WorkspaceStatusBar'
import WorkspaceUploadOverlay from '../WorkspaceUploadOverlay'
import WorkspaceProgressStepper, { type WorkspaceStep } from '../WorkspaceProgressStepper'
import ViewportGuideOverlay from '../ViewportGuideOverlay'
import SunlightSidePanel from './SunlightSidePanel'
import SunlightShadowControls from './SunlightShadowControls'
import SunTimeSlider from '@/components/shared/SunTimeSlider'
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
// ShadowOverlay disabled — GPU shadow maps handle ground/building shadows
// const ShadowOverlay = dynamic(() => import('@/components/SunlightAnalysis/3d/ShadowOverlay'), { ssr: false })
const SunPositionIndicator = dynamic(() => import('@/components/SunlightAnalysis/3d/SunPositionIndicator'), { ssr: false })
const ViolationHighlight = dynamic(() => import('@/components/SunlightAnalysis/3d/ViolationHighlight'), { ssr: false })
const BuildingLabels3D = dynamic(() => import('@/components/SunlightAnalysis/3d/BuildingLabels3D'), { ssr: false })
const ModelTransformControls = dynamic(() => import('@/components/shared/3d/interaction/ModelTransformControls'), { ssr: false })
const GroundHeatmap = dynamic(() => import('@/components/SunlightAnalysis/3d/GroundHeatmap'), { ssr: false })
const ContourLines = dynamic(() => import('@/components/SunlightAnalysis/3d/ContourLines'), { ssr: false })
const SolarChart3DOverlay = dynamic(() => import('@/components/SunlightAnalysis/3d/SolarChart3DOverlay'), { ssr: false })
const CameraPresetApplier = dynamic(() => import('@/components/shared/3d/CameraPresetBar').then(m => ({ default: m.CameraPresetApplier })), { ssr: false })

import SunlightLegend from '@/components/SunlightAnalysis/3d/SunlightLegend'
import CameraPresetBar from '@/components/shared/3d/CameraPresetBar'
import { Undo2, Redo2 } from 'lucide-react'

const VIEWPORT_GUIDE_STEPS = [
  { key: 'mode', label: 'P 키를 눌러 측정점 모드 전환' },
  { key: 'click', label: '건물 표면을 클릭하여 측정점 배치' },
  { key: 'analyze', label: '사이드 패널에서 분석 실행' },
]


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
    uploadProgress,
    uploadFile,
    runAnalysis,
    cancelAnalysis,
    reset,
  } = pipeline

  const { showToast } = useToast()

  // 분석 오류 발생 시 토스트 알림
  useEffect(() => {
    if (error) {
      showToast({ type: 'error', message: error })
    }
  }, [error, showToast])

  // Config state
  const [config, setConfig] = useState<SunlightConfigState>({ ...DEFAULT_SUNLIGHT_CONFIG })

  // 3D model (useMemo로 객체 참조 안정화 — 매 렌더마다 새 객체 생성 방지)
  const modelConfig = useMemo<ModelConfig | null>(() =>
    sceneUrl ? { url: sceneUrl, format: 'glb', autoCenter: true, zUp: false } : null,
    [sceneUrl]
  )
  const { state: modelState, scene: modelScene, bbox: modelBbox } = useModelLoader(modelConfig)
  const hasModel = modelState === 'loaded' && !!modelScene

  // Transform controls
  const [transformMode] = useState<'translate' | 'rotate'>('translate')

  // Camera preset
  const [activePreset, setActivePreset] = useState<CameraPresetId>('perspective')
  const [presetTrigger, setPresetTrigger] = useState(0)
  const handlePresetChange = useCallback((id: CameraPresetId) => {
    setActivePreset(id)
    setPresetTrigger(t => t + 1)
  }, [])

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

  // Client-side sun position (real-time slider, pre-analysis)
  const [sliderTimeMinute, setSliderTimeMinute] = useState(720) // noon
  const [sliderMonth, setSliderMonth] = useState(config.date.month)
  const [sliderDay, setSliderDay] = useState(config.date.day)
  const clientSun = useSunDirection(
    config.latitude, config.longitude, sliderMonth, sliderDay, sliderTimeMinute, config.timezone / 15,
  )
  const { sunrise, sunset } = useSunriseSunset(
    config.latitude, config.longitude, sliderMonth, sliderDay, config.timezone / 15,
  )

  // Report generation (extracted hook — auto-generates on completion)
  const report = useReportGeneration({
    sessionId,
    config: {
      latitude: config.latitude,
      longitude: config.longitude,
      timezone: config.timezone,
      date: config.date,
      buildingType: config.buildingType,
    },
    results,
    autoGenerate: true,
  })

  // Ground analysis (extracted hook)
  const [gridInterval, setGridInterval] = useState(2.0)
  const ground = useGroundAnalysis({
    sessionId,
    gridInterval,
    config: {
      latitude: config.latitude,
      longitude: config.longitude,
      timezone: config.timezone,
      date: config.date,
    },
  })

  // Solar chart 3D (extracted hook)
  const solarChart = useSolarChart3D()

  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)

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

  // 레이어에서 측정점 자동 생성
  const handleGenerateGroupPoints = useCallback(async (layerId: string): Promise<number> => {
    if (!modelMeta?.model_id) return 0
    try {
      const res = await fetch(`${apiUrl}/import/${modelMeta.model_id}/generate-group-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_name: layerId, offset: 0.1 }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('측정점 생성 실패:', err.detail || res.statusText)
        return 0
      }
      const data = await res.json()
      if (data.count === 0) return 0

      // 측정점 그룹에 추가
      const prevActiveGroup = pointGroups.activeGroupId
      pointGroups.importGroups([{
        groupName: layerId,
        points: data.points.map((p: { id: string; x: number; y: number; z: number; name: string }) => ({
          id: p.id, x: p.x, y: p.y, z: p.z, name: p.name,
        })),
      }])
      // 이전 활성 그룹 복원 (sync가 새 그룹을 덮어쓰지 않도록)
      if (prevActiveGroup) pointGroups.setActiveGroup(prevActiveGroup)

      // 3D 표시용으로 placement에도 추가
      for (const p of data.points) {
        placement.addPointDirect({
          id: p.id,
          name: p.name,
          position: { x: p.x, y: p.y, z: p.z },
        })
      }

      return data.count
    } catch (err) {
      console.error('측정점 생성 오류:', err)
      return 0
    }
  }, [modelMeta, apiUrl, pointGroups, placement])

  // 숨겨진 그룹 세트 (3D 가시성 + 분석 제외)
  const hiddenGroups = useMemo(() => {
    const set = new Set<string>()
    layers.forEach(l => { if (!l.visible) set.add(l.id) })
    return set
  }, [layers])

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
  const handleFileSelect = useCallback(async (file: File, mtlFile?: File) => {
    await uploadFile(file, mtlFile)
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
      excluded_groups: layers.filter(l => !l.isAnalysisTarget).map(l => l.id),
    }
    await runAnalysis(analysisConfig)
  }, [config, runAnalysis, pointGroups.allMeasurementPoints, layers])

  // ── Status bar state ──
  const statusBarState = useStatusBarState({ phase, error })

  // ── Progress stepper step ──
  const currentStep = useMemo((): WorkspaceStep => {
    if (phase === 'completed') return 'results'
    if (phase === 'running' || phase === 'polling') return 'analyze'
    if (hasModel) return 'configure'
    return 'upload'
  }, [phase, hasModel])

  const statusModelInfo = modelMeta
    ? `${modelMeta.original_name} | V: ${modelMeta.vertices.toLocaleString()} F: ${modelMeta.faces.toLocaleString()}`
    : undefined

  const statusStageName = progress?.stages.find((s) => s.status === 'processing')?.name

  // ── Sun direction: backend frames take priority, otherwise client-side ──
  const hasShadowFrames = shadow.frames.length > 0
  const sunDirection = useMemo((): [number, number, number] => {
    if (hasShadowFrames && shadow.currentFrame && shadow.currentFrame.solar_altitude > 0) {
      const altRad = (shadow.currentFrame.solar_altitude * Math.PI) / 180
      const aziRad = (shadow.currentFrame.solar_azimuth * Math.PI) / 180
      return [
        Math.cos(altRad) * Math.sin(aziRad) * 100,
        Math.sin(altRad) * 100,
        -Math.cos(altRad) * Math.cos(aziRad) * 100,
      ]
    }
    return clientSun.direction
  }, [hasShadowFrames, shadow.currentFrame, clientSun.direction])

  const solarPosition = hasShadowFrames && shadow.currentFrame
    ? { altitude: shadow.currentFrame.solar_altitude, azimuth: shadow.currentFrame.solar_azimuth }
    : { altitude: clientSun.altitude, azimuth: clientSun.azimuth }

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
  }, [placement.undo, placement.redo])

  return (
    <AnalysisWorkspace
      progressStepper={<WorkspaceProgressStepper currentStep={currentStep} />}
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
          onBatchCreate={pointGroups.batchCreatePoints}
          isRunning={isRunning}
          onStartAnalysis={handleStartAnalysis}
          error={error}
          results={results}
          onGenerateReport={report.generateReport}
          reportDownloadUrl={report.reportDownloadUrl}
          isGeneratingReport={report.isGeneratingReport}
          causeResult={report.causeResult}
          selectedBuildingId={selectedBuildingId}
          onBuildingSelect={setSelectedBuildingId}
          gridInterval={gridInterval}
          onGridIntervalChange={setGridInterval}
          onStartGroundAnalysis={ground.runGroundAnalysis}
          isGroundAnalysisRunning={ground.isGroundAnalyzing}
          sessionId={sessionId}
          layers={layers}
          onToggleLayerVisibility={handleToggleLayerVisibility}
          onToggleAnalysisTarget={handleToggleAnalysisTarget}
          onToggleAllLayers={handleToggleAllLayers}
          onGenerateGroupPoints={handleGenerateGroupPoints}
          solarChart={solarChart}
          activeTab={layout.activePanelTab}
          onTabChange={layout.setActivePanelTab}
        />
      }
      bottomControls={
        hasShadowFrames ? (
          <SunlightShadowControls
            playback={shadow.playback}
            maxMinute={shadow.frames[shadow.frames.length - 1].minute}
            stepSize={shadow.frames.length > 1 ? shadow.frames[1].minute - shadow.frames[0].minute : 10}
            onMinuteChange={shadow.setCurrentMinute}
            onPlay={shadow.play}
            onPause={shadow.pause}
            onSpeedChange={shadow.setSpeed}
          />
        ) : hasModel ? (
          <SunTimeSlider
            timeMinute={sliderTimeMinute}
            month={sliderMonth}
            sunrise={sunrise}
            sunset={sunset}
            altitude={clientSun.altitude}
            onTimeChange={setSliderTimeMinute}
            onMonthChange={(m, d) => { setSliderMonth(m); setSliderDay(d) }}
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
      {/* ── 3D Viewport ── */}
      <WorkspaceViewport
        bbox={modelBbox}
        orbitEnabled={placement.mode === 'navigate'}
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
            interactionEnabled={placement.mode === 'place_point'}
            onSurfaceHover={placement.setHoverHit}
            onSurfaceClick={placement.handleSurfaceClick}
            groups={importData?.groups}
            hiddenGroups={hiddenGroups}
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

        {/* Sun position indicator (always visible when model loaded) */}
        {hasModel && solarPosition && solarPosition.altitude > 0 && (
          <SunPositionIndicator solarPosition={solarPosition} />
        )}

        {/* Ground heatmap overlay */}
        {ground.showGroundHeatmap && ground.groundResult && ground.groundResult.grid_data.length > 0 && (
          <GroundHeatmap
            gridData={ground.groundResult.grid_data}
            gridSize={ground.groundResult.grid_size}
          />
        )}

        {/* Isochrone / contour lines */}
        {ground.showGroundHeatmap && ground.groundIsochrones.length > 0 && (
          <ContourLines lines={ground.groundIsochrones} />
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

        {/* Building labels + Violation highlight (cause analysis) */}
        {report.causeResult && report.causeResult.buildings.length > 0 && (
          <BuildingLabels3D
            buildings={report.causeResult.buildings}
            selectedBuildingId={selectedBuildingId}
            onBuildingClick={(id) => setSelectedBuildingId(
              selectedBuildingId === id ? null : id
            )}
          />
        )}
        {report.causeResult && report.causeResult.point_causes.length > 0 && (
          <ViolationHighlight
            blockers={report.causeResult.point_causes.flatMap((pc) => pc.blockers)}
            selectedBuildingId={selectedBuildingId}
          />
        )}

        {/* Solar chart 3D overlay */}
        {solarChart.data && (
          <SolarChart3DOverlay data={solarChart.data} />
        )}

        {/* Camera preset controller (R3F) */}
        <CameraPresetApplier presetId={activePreset} trigger={presetTrigger} bbox={modelBbox} />
      </WorkspaceViewport>

      {/* Camera preset bar (HTML overlay) */}
      {hasModel && (
        <CameraPresetBar
          bbox={modelBbox}
          activePreset={activePreset}
          onPresetChange={handlePresetChange}
        />
      )}

      {/* Mode indicator + Legend overlay */}
      {hasModel && (
        <div className="absolute bottom-16 left-3 z-10 space-y-2">
          {results && results.points.length > 0 && <SunlightLegend />}
          {placement.mode !== 'navigate' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm
              text-white text-[11px] rounded-full shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              {SUNLIGHT_TOOLBAR_MODES.find(m => m.id === placement.mode)?.label ?? placement.mode}
              <span className="text-white/40 ml-1">ESC로 해제</span>
            </div>
          )}
        </div>
      )}

      {/* Keyboard shortcut help overlay */}
      {layout.isShortcutOverlayVisible && (
        <KeyboardShortcutOverlay
          modes={SUNLIGHT_TOOLBAR_MODES}
          onClose={layout.closeShortcutOverlay}
        />
      )}

      {/* Viewport guide — shown after model load, before first point */}
      <ViewportGuideOverlay
        visible={hasModel && placement.points.length === 0 && !results && !isRunning}
        steps={VIEWPORT_GUIDE_STEPS}
      />
    </AnalysisWorkspace>
  )
}
