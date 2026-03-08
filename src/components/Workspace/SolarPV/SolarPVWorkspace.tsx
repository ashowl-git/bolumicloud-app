'use client'

import { useState, useCallback, useEffect, useMemo, Suspense } from 'react'
import { useSolarPVPipelineContext } from '@/contexts/SolarPVPipelineContext'
import { useModelLoader } from '@/components/shared/3d/useModelLoader'
import { useWorkspaceLayout } from '../hooks/useWorkspaceLayout'
import { useReportGeneration } from '@/hooks/useReportGeneration'
import type { SolarPVRunConfig } from '@/lib/types/solar-pv'
import { DEFAULT_SOLAR_PV_CONFIG } from '@/lib/types/solar-pv'
import type { LayerConfig } from '@/lib/types/sunlight'
import type { ModelConfig, CameraPresetId } from '@/components/shared/3d/types'
import { useApi } from '@/contexts/ApiContext'
import { useApiClient } from '@/lib/api'
import { useShadowAnimation } from '@/components/SunlightAnalysis/hooks/useShadowAnimation'
import { useSunDirection, useSunriseSunset } from '@/hooks/useSunDirection'
import type { ShadowAccumulationCell } from '@/components/SolarPVAnalysis/3d/SolarPVShadowHeatmap'
import type { ReflectionFrame } from '@/components/SolarPVAnalysis/3d/ReflectionOverlay'

import AnalysisWorkspace from '../AnalysisWorkspace'
import WorkspaceUploadOverlay from '../WorkspaceUploadOverlay'
import WorkspaceProgressStepper, { type WorkspaceStep } from '../WorkspaceProgressStepper'
import SolarPVSidePanel from './SolarPVSidePanel'
import SolarPVViewport from './SolarPVViewport'
import SolarPVStatusBarContainer from './SolarPVStatusBarContainer'
import SunTimeSlider from '@/components/shared/SunTimeSlider'

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

  // Shadow animation
  const { apiUrl } = useApi()
  const api = useApiClient()
  const shadow = useShadowAnimation({ apiUrl })

  // Camera preset
  const [activePreset, setActivePreset] = useState<CameraPresetId>('perspective')
  const [presetTrigger, setPresetTrigger] = useState(0)
  const handlePresetChange = useCallback((id: CameraPresetId) => {
    setActivePreset(id)
    setPresetTrigger(t => t + 1)
  }, [])

  // Config state
  const [config, setConfig] = useState<SolarPVRunConfig>(DEFAULT_SOLAR_PV_CONFIG)
  const [layers, setLayers] = useState<LayerConfig[]>([])
  const [selectedSurface, setSelectedSurface] = useState<string | null>(null)
  const [shadowDate, setShadowDate] = useState({ month: 6, day: 21 })

  // Client-side sun position (real-time slider)
  const [sliderTimeMinute, setSliderTimeMinute] = useState(720)
  const [sliderMonth, setSliderMonth] = useState(6)
  const [sliderDay, setSliderDay] = useState(21)
  const clientSun = useSunDirection(
    config.latitude, config.longitude, sliderMonth, sliderDay, sliderTimeMinute, config.timezone_offset,
  )
  const { sunrise, sunset } = useSunriseSunset(
    config.latitude, config.longitude, sliderMonth, sliderDay, config.timezone_offset,
  )

  // Shadow accumulation heatmap
  const [showShadowHeatmap, setShowShadowHeatmap] = useState(false)
  const [shadowAccumulation, setShadowAccumulation] = useState<{
    cells: ShadowAccumulationCell[]
    cellSize: number
    maxShadowHours: number
  } | null>(null)
  const [shadowHeatmapLoading, setShadowHeatmapLoading] = useState(false)
  const [shadowHeatmapMode, setShadowHeatmapMode] = useState<'hours' | 'ratio'>('hours')

  // Range accumulation (date range)
  const [shadowDateRange, setShadowDateRange] = useState({
    startMonth: 1, startDay: 1,
    endMonth: 12, endDay: 31,
    startHour: 8, endHour: 16,
    sampleCount: 12,
  })
  const [rangeAccumLoading, setRangeAccumLoading] = useState(false)

  // Reflection overlay
  const [showReflection, setShowReflection] = useState(false)
  const [reflectionFrames, setReflectionFrames] = useState<ReflectionFrame[]>([])
  const [reflectionLoading, setReflectionLoading] = useState(false)

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
  // Auto-detect panel layers by keyword matching (roof, 지붕, panel, etc.)
  useEffect(() => {
    const LAYER_COLORS = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316']
    const PANEL_KEYWORDS = ['roof', '지붕', 'panel', '패널', 'top', '옥상', 'solar', 'pv']
    if (!importData?.groups || importData.groups.length === 0) return
    setLayers(importData.groups.map((g, i) => ({
      id: g.name,
      name: g.name,
      visible: g.visible ?? true,
      isAnalysisTarget: true,
      isPanelLayer: PANEL_KEYWORDS.some(kw => g.name.toLowerCase().includes(kw)),
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

  // Auto shadow compute on analysis completion
  useEffect(() => {
    if (phase === 'completed' && results && sessionId && shadow.frames.length === 0 && !shadow.isComputing) {
      shadow.computeShadows({
        sessionId,
        latitude: config.latitude,
        longitude: config.longitude,
        month: shadowDate.month,
        day: shadowDate.day,
        timezoneOffset: config.timezone_offset,
        stepMinutes: 10,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, results, sessionId])

  // Clear shadow accumulation when shadow session changes
  useEffect(() => {
    setShadowAccumulation(null)
    setShowShadowHeatmap(false)
  }, [shadow.shadowId])

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

  const handleTogglePanelLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, isPanelLayer: !l.isPanelLayer } : l))
  }, [])

  const handleToggleAllLayers = useCallback((visible: boolean) => {
    setLayers(prev => prev.map(l => ({ ...l, visible })))
  }, [])

  const handleStartAnalysis = useCallback(async () => {
    const panelLayerIds = layers
      .filter(l => l.isPanelLayer)
      .map(l => l.name)

    if (panelLayerIds.length === 0) {
      console.warn('[SolarPV] panel_layer_ids is empty — aborting analysis')
      return
    }

    const excludedGroups = layers
      .filter(l => !l.isAnalysisTarget)
      .map(l => l.name)

    const runConfig: SolarPVRunConfig = {
      ...config,
      panel_layer_ids: panelLayerIds,
      excluded_groups: excludedGroups,
    }

    await runAnalysis(runConfig)
  }, [config, layers, runAnalysis])

  // Sun direction: backend frames take priority, otherwise client-side
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

  // Shadow frame absolute minutes (for SunTimeSlider snapping)
  const shadowFrameMinutes = useMemo(() =>
    shadow.frames.map(f => shadow.startMinuteBase + f.minute),
  [shadow.frames, shadow.startMinuteBase])

  // Sync shadow playback -> sliderTimeMinute
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

  const handleComputeShadows = useCallback(() => {
    if (!sessionId) return
    shadow.computeShadows({
      sessionId,
      latitude: config.latitude,
      longitude: config.longitude,
      month: shadowDate.month,
      day: shadowDate.day,
      timezoneOffset: config.timezone_offset,
      stepMinutes: 10,
    })
  }, [sessionId, shadow.computeShadows, config.latitude, config.longitude, config.timezone_offset, shadowDate])

  const handleToggleShadowHeatmap = useCallback(async () => {
    if (showShadowHeatmap) {
      setShowShadowHeatmap(false)
      return
    }
    if (!shadow.shadowId) return
    if (!shadowAccumulation) {
      setShadowHeatmapLoading(true)
      try {
        const data = await api.get(`/shadows/${shadow.shadowId}/accumulation?cell_size=2.0`)
        setShadowAccumulation({
          cells: data.cells,
          cellSize: data.cell_size,
          maxShadowHours: data.max_shadow_hours,
        })
      } catch (err) {
        console.error('Shadow accumulation error:', err)
      } finally {
        setShadowHeatmapLoading(false)
      }
    }
    setShadowHeatmapMode('hours')
    setShowShadowHeatmap(true)
  }, [showShadowHeatmap, shadow.shadowId, shadowAccumulation, api])

  const handleComputeRangeAccumulation = useCallback(async () => {
    if (!sessionId) return
    setRangeAccumLoading(true)
    try {
      const startResp = await api.post('/shadows/range-accumulation', {
        session_id: sessionId,
        latitude: config.latitude,
        longitude: config.longitude,
        timezone_offset: config.timezone_offset,
        start_month: shadowDateRange.startMonth,
        start_day: shadowDateRange.startDay,
        end_month: shadowDateRange.endMonth,
        end_day: shadowDateRange.endDay,
        start_hour: shadowDateRange.startHour,
        end_hour: shadowDateRange.endHour,
        cell_size: 2.0,
        sample_count: shadowDateRange.sampleCount,
      })

      const rangeId = startResp.range_shadow_id

      // Poll for completion
      let done = false
      const pollStart = Date.now()
      const POLL_TIMEOUT_MS = 300_000 // 5 minutes
      while (!done) {
        if (Date.now() - pollStart > POLL_TIMEOUT_MS) {
          throw new Error('영역도 계산 시간 초과 (5분)')
        }
        await new Promise(r => setTimeout(r, 2000))
        const status = await api.get(`/shadows/range-accumulation/${rangeId}/status`)
        if (status.status === 'completed') {
          done = true
        } else if (status.status === 'error') {
          throw new Error(status.error || '영역도 계산 오류')
        }
      }

      const result = await api.get(`/shadows/range-accumulation/${rangeId}/result`)
      setShadowAccumulation({
        cells: result.cells.map((c: { x: number; y: number; shadow_ratio: number }) => ({
          x: c.x,
          y: c.y,
          shadow_hours: c.shadow_ratio * result.max_shadow_ratio, // normalized for color scale
          shadow_ratio: c.shadow_ratio,
        })),
        cellSize: result.cell_size,
        maxShadowHours: result.max_shadow_ratio,
      })
      setShadowHeatmapMode('ratio')
      setShowShadowHeatmap(true)
    } catch (err) {
      console.error('Range accumulation error:', err)
    } finally {
      setRangeAccumLoading(false)
    }
  }, [sessionId, api, config.latitude, config.longitude, config.timezone_offset, shadowDateRange])

  // Current reflection frame synced with shadow playback
  const currentReflectionFrame = useMemo(() => {
    if (!showReflection || reflectionFrames.length === 0) return null
    return reflectionFrames.find(f => f.minute === shadow.playback.currentMinute) ?? null
  }, [showReflection, reflectionFrames, shadow.playback.currentMinute])

  const handleToggleReflection = useCallback(async () => {
    if (showReflection) {
      setShowReflection(false)
      return
    }
    if (!sessionId || !results) return

    if (reflectionFrames.length === 0) {
      setReflectionLoading(true)
      try {
        await api.post(`/solar-pv/${sessionId}/reflection`, {
          latitude: config.latitude,
          longitude: config.longitude,
          timezone_offset: config.timezone_offset,
          month: shadowDate.month,
          day: shadowDate.day,
          step_minutes: 10,
        })

        // Poll for completion (60s timeout)
        let done = false
        const pollStart = Date.now()
        const POLL_TIMEOUT_MS = 60_000
        while (!done) {
          if (Date.now() - pollStart > POLL_TIMEOUT_MS) {
            throw new Error('반사 계산 시간 초과 (60초)')
          }
          await new Promise(r => setTimeout(r, 1000))
          const status = await api.get(`/solar-pv/${sessionId}/reflection/status`)
          if (status.status === 'completed') {
            done = true
          } else if (status.status === 'error') {
            throw new Error(status.error || '반사 계산 오류')
          }
        }

        const result = await api.get(`/solar-pv/${sessionId}/reflection/result`)
        setReflectionFrames(result.frames)
      } catch (err) {
        console.error('Reflection computation error:', err)
      } finally {
        setReflectionLoading(false)
      }
    }
    setShowReflection(true)
  }, [showReflection, sessionId, results, reflectionFrames.length, api, config.latitude, config.longitude, config.timezone_offset, shadowDate])

  const isRunning = phase === 'running' || phase === 'polling'

  // Report generation
  const report = useReportGeneration({
    sessionId,
    analysisType: 'solar_pv',
    results,
    autoGenerate: true,
  })

  // Progress stepper step
  const currentStep = useMemo((): WorkspaceStep => {
    if (phase === 'completed') return 'results'
    if (phase === 'running' || phase === 'polling') return 'analyze'
    if (hasModel) return 'configure'
    return 'upload'
  }, [phase, hasModel])

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
          onTogglePanelLayer={handleTogglePanelLayer}
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
          shadowDate={shadowDate}
          onShadowDateChange={setShadowDate}
          onComputeShadows={handleComputeShadows}
          shadowIsComputing={shadow.isComputing}
          shadowComputeProgress={shadow.computeProgress}
          shadowFrameCount={shadow.frames.length}
          showShadowHeatmap={showShadowHeatmap}
          onToggleShadowHeatmap={handleToggleShadowHeatmap}
          shadowHeatmapLoading={shadowHeatmapLoading}
          shadowDateRange={shadowDateRange}
          onShadowDateRangeChange={setShadowDateRange}
          onComputeRangeAccumulation={handleComputeRangeAccumulation}
          rangeAccumLoading={rangeAccumLoading}
          showReflection={showReflection}
          onToggleReflection={handleToggleReflection}
          reflectionLoading={reflectionLoading}
          onGenerateReport={report.generateReport}
          reportDownloadUrl={report.reportDownloadUrl}
          isGeneratingReport={report.isGeneratingReport}
        />
      }
      statusBar={
        <SolarPVStatusBarContainer
          phase={phase}
          error={error}
          progress={progress}
          results={results}
          estimatedRemainingSec={estimatedRemainingSec}
          modelMeta={modelMeta}
          onViewResults={() => {
            layout.setActivePanelTab('results')
            layout.setSidePanelOpen(true)
          }}
          onRetry={handleStartAnalysis}
          onReset={reset}
          onCancel={cancelAnalysis}
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
          />
        ) : undefined
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
      <Suspense fallback={<div className="flex items-center justify-center h-full text-sm text-gray-400">3D 로딩 중...</div>}>
        <SolarPVViewport
          sunDirection={sunDirection}
          modelScene={modelScene}
          modelBbox={modelBbox}
          importDataGroups={importData?.groups}
          hiddenGroups={hiddenGroups}
          hasModel={hasModel}
          results={results}
          selectedSurface={selectedSurface}
          onSelectSurface={setSelectedSurface}
          surfaceCenters={surfaceCenters}
          surfaceNormals={surfaceNormals}
          surfaceAreas={surfaceAreas}
          panelSurfacesForHighlight={panelSurfacesForHighlight}
          showShadowHeatmap={showShadowHeatmap}
          shadowAccumulation={shadowAccumulation}
          shadowHeatmapMode={shadowHeatmapMode}
          showReflection={showReflection}
          currentReflectionFrame={currentReflectionFrame}
          solarPosition={solarPosition}
          activePreset={activePreset}
          presetTrigger={presetTrigger}
          onPresetChange={handlePresetChange}
        />
      </Suspense>
    </AnalysisWorkspace>
  )
}
