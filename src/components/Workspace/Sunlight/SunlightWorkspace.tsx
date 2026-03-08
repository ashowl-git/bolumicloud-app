'use client'

import { useState, useCallback, useEffect, useMemo, Suspense } from 'react'
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
import { useSunDirection, useSunriseSunset } from '@/hooks/useSunDirection'
import { useToast } from '@/contexts/ToastContext'

import AnalysisWorkspace from '../AnalysisWorkspace'
import WorkspaceToolbar from '../WorkspaceToolbar'
import WorkspaceUploadOverlay from '../WorkspaceUploadOverlay'
import WorkspaceProgressStepper, { type WorkspaceStep } from '../WorkspaceProgressStepper'
import SunlightSidePanel from './SunlightSidePanel'
import SunTimeSlider from '@/components/shared/SunTimeSlider'
import { SUNLIGHT_TOOLBAR_MODES } from './SunlightToolbarConfig'
import SunlightViewport from './SunlightViewport'
import SunlightStatusBarContainer from './SunlightStatusBarContainer'
import { Undo2, Redo2 } from 'lucide-react'


// ─── Component ─────────────────────────────
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
  const [showAccumulation, setShowAccumulation] = useState(false)
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
        startHour: Math.floor(sunrise / 60),
        endHour: Math.ceil(sunset / 60),
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

  // ── Progress stepper step ──
  const currentStep = useMemo((): WorkspaceStep => {
    if (phase === 'completed') return 'results'
    if (phase === 'running' || phase === 'polling') return 'analyze'
    if (hasModel) return 'configure'
    return 'upload'
  }, [phase, hasModel])

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

  // Shadow frame absolute minutes (for SunTimeSlider snapping)
  const shadowFrameMinutes = useMemo(() =>
    shadow.frames.map(f => shadow.startMinuteBase + f.minute),
  [shadow.frames, shadow.startMinuteBase])

  // Sync shadow playback → sliderTimeMinute
  useEffect(() => {
    if (hasShadowFrames) {
      setSliderTimeMinute(shadow.startMinuteBase + shadow.playback.currentMinute)
    }
  }, [hasShadowFrames, shadow.playback.currentMinute, shadow.startMinuteBase])

  // Time change handler: snaps to nearest shadow frame when available
  const handleTimeChange = useCallback((absoluteMinute: number) => {
    if (hasShadowFrames) {
      const offset = absoluteMinute - shadow.startMinuteBase
      let closestMinute = 0
      let minDiff = Infinity
      for (const f of shadow.frames) {
        const diff = Math.abs(f.minute - offset)
        if (diff < minDiff) {
          minDiff = diff
          closestMinute = f.minute
        }
      }
      shadow.setCurrentMinute(closestMinute)
    } else {
      setSliderTimeMinute(absoluteMinute)
    }
  }, [hasShadowFrames, shadow.frames, shadow.startMinuteBase, shadow.setCurrentMinute])

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

  // ── Status bar callbacks ──
  const handleViewResults = useCallback(() => {
    layout.setActivePanelTab('results')
    layout.setSidePanelOpen(true)
  }, [layout])

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
        hasModel ? (
          <SunTimeSlider
            timeMinute={sliderTimeMinute}
            month={sliderMonth}
            day={sliderDay}
            sunrise={sunrise}
            sunset={sunset}
            altitude={solarPosition.altitude}
            onTimeChange={handleTimeChange}
            onMonthChange={(m, d) => { setSliderMonth(m); setSliderDay(d) }}
            shadowPlayback={hasShadowFrames ? {
              isPlaying: shadow.playback.isPlaying,
              speed: shadow.playback.speed,
              frameMinutes: shadowFrameMinutes,
            } : undefined}
            onPlay={shadow.play}
            onPause={shadow.pause}
            onSpeedChange={shadow.setSpeed}
            showAccumulation={showAccumulation}
            onToggleAccumulation={() => setShowAccumulation(prev => !prev)}
          />
        ) : undefined
      }
      statusBar={
        <SunlightStatusBarContainer
          phase={phase}
          error={error}
          progress={progress}
          results={results}
          estimatedRemainingSec={estimatedRemainingSec}
          modelMeta={modelMeta}
          onViewResults={handleViewResults}
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
      <Suspense fallback={<div className="flex items-center justify-center h-full text-sm text-gray-400">3D 로딩 중...</div>}>
        <SunlightViewport
          modelScene={modelScene}
          modelBbox={modelBbox}
          hasModel={hasModel}
          importData={importData}
          activePreset={activePreset}
          presetTrigger={presetTrigger}
          onPresetChange={handlePresetChange}
          placementMode={placement.mode}
          hoverHit={placement.hoverHit}
          selectedPointId={placement.selectedPointId}
          points={placement.points}
          onSurfaceHover={placement.setHoverHit}
          onSurfaceClick={placement.handleSurfaceClick}
          onPointClick={placement.handlePointClick}
          onSelectPoint={placement.selectPoint}
          areaFirstCorner={areaPlacement.firstCorner}
          areaPreviewCorner={areaPlacement.previewCorner}
          areaArea={areaPlacement.area}
          areaGridSpacing={areaPlacement.gridSpacing}
          areaGridPoints={areaPlacement.gridPoints}
          onAreaHover={areaPlacement.handleAreaHover}
          onAreaClick={areaPlacement.handleAreaClick}
          transformMode={transformMode}
          hiddenGroups={hiddenGroups}
          sunDirection={sunDirection}
          solarPosition={solarPosition}
          results={results}
          causeResult={report.causeResult}
          selectedBuildingId={selectedBuildingId}
          onBuildingClick={(id) => setSelectedBuildingId(
            selectedBuildingId === id ? null : id
          )}
          showGroundHeatmap={ground.showGroundHeatmap}
          groundResult={ground.groundResult}
          groundIsochrones={ground.groundIsochrones}
          showAccumulation={showAccumulation}
          shadowAccumulation={shadow.accumulation}
          solarChartData={solarChart.data}
          isShortcutOverlayVisible={layout.isShortcutOverlayVisible}
          onCloseShortcutOverlay={layout.closeShortcutOverlay}
          isRunning={isRunning}
        />
      </Suspense>
    </AnalysisWorkspace>
  )
}
