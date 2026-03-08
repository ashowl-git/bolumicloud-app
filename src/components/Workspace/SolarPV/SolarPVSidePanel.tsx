'use client'

import { useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Settings, BarChart3,
  Zap, Sun, DollarSign, AlertCircle, Loader2,
  TrendingUp, Battery, Layers, MapPin,
  Leaf, Award, TreePine, FileDown,
} from 'lucide-react'
import type {
  SolarPVRunConfig, SolarPVResult, SolarPVProgress,
  PVModulePresetInfo, ShadowCalendar,
} from '@/lib/types/solar-pv'
import { MODULE_PRESET_LABELS, LOSS_PROFILE_LABELS, GROUND_ALBEDO_PRESETS } from '@/lib/types/solar-pv'
import type { LayerConfig } from '@/lib/types/sunlight'
import type { PanelTab } from '../hooks/useWorkspaceLayout'
import WorkspacePanelSection from '../WorkspacePanelSection'

interface SolarPVSidePanelProps {
  open: boolean
  onClose: () => void
  onOpen: () => void
  config: SolarPVRunConfig
  onConfigChange: (partial: Partial<SolarPVRunConfig>) => void
  layers: LayerConfig[]
  onToggleLayerVisibility: (id: string) => void
  onToggleAnalysisTarget: (id: string) => void
  isRunning: boolean
  onStartAnalysis: () => void
  onCancelAnalysis: () => void
  results: SolarPVResult | null
  error: string | null
  progress: SolarPVProgress | null
  selectedSurface: string | null
  onSelectSurface: (id: string | null) => void
  modulePresets: PVModulePresetInfo[]
  activeTab: PanelTab
  onTabChange: (tab: PanelTab) => void
  onGenerateReport?: () => Promise<void>
  reportDownloadUrl?: string | null
  isGeneratingReport?: boolean
}

// --- Surface Score 색상 ---
function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-amber-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

// --- Shadow Calendar 미니 히트맵 ---
function ShadowCalendarMini({ calendar }: { calendar: ShadowCalendar }) {
  return (
    <div className="mt-2">
      <p className="text-[10px] text-gray-500 mb-1">Shadow Calendar (월 x 시)</p>
      <div className="flex flex-col gap-px">
        {calendar.matrix.map((row, mi) => (
          <div key={mi} className="flex gap-px items-center">
            <span className="text-[7px] text-gray-600 w-3 text-right">{mi + 1}</span>
            {row.map((val, hi) => (
              <div
                key={hi}
                className="w-[11px] h-[7px] rounded-[1px]"
                style={{
                  backgroundColor: val > 0.8 ? '#991b1b' : val > 0.5 ? '#dc2626' : val > 0.2 ? '#f59e0b' : val > 0.05 ? '#eab308' : '#22c55e',
                  opacity: 0.9,
                }}
                title={`${mi + 1}월 ${calendar.hours[hi]}시: 그림자 ${(val * 100).toFixed(0)}%`}
              />
            ))}
          </div>
        ))}
        <div className="flex gap-px items-center mt-0.5">
          <span className="w-3" />
          {calendar.hours.filter((_, i) => i % 3 === 0).map(h => (
            <span key={h} className="text-[7px] text-gray-600" style={{ width: `${3 * 12}px` }}>{h}</span>
          ))}
        </div>
      </div>
      <div className="flex gap-2 mt-1 text-[8px] text-gray-500">
        <span className="flex items-center gap-0.5"><span className="w-2 h-2 bg-green-500 rounded-sm inline-block" /> 0-5%</span>
        <span className="flex items-center gap-0.5"><span className="w-2 h-2 bg-yellow-500 rounded-sm inline-block" /> 5-50%</span>
        <span className="flex items-center gap-0.5"><span className="w-2 h-2 bg-red-600 rounded-sm inline-block" /> 50%+</span>
      </div>
    </div>
  )
}

export default function SolarPVSidePanel({
  open, onClose, onOpen,
  config, onConfigChange,
  layers, onToggleLayerVisibility: _onToggleLayerVisibility, onToggleAnalysisTarget,
  isRunning, onStartAnalysis, onCancelAnalysis,
  results, error, progress: _progress,
  selectedSurface, onSelectSurface,
  modulePresets,
  activeTab, onTabChange,
  onGenerateReport, reportDownloadUrl, isGeneratingReport,
}: SolarPVSidePanelProps) {
  const presetInfo = modulePresets.find(p => p.id === config.module_preset)
  const selectedSurfaceData = useMemo(
    () => results?.surfaces.find(s => s.surface_id === selectedSurface) ?? null,
    [results, selectedSurface],
  )

  if (!open) {
    return (
      <button
        onClick={onOpen}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-l-lg"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    )
  }

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-white">태양광 발전 분석</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => onTabChange('settings')}
          className={`flex-1 py-2 text-xs font-medium ${activeTab === 'settings' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-400'}`}
        >
          <Settings className="w-3 h-3 inline mr-1" />
          설정
        </button>
        <button
          onClick={() => onTabChange('results')}
          className={`flex-1 py-2 text-xs font-medium ${activeTab === 'results' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-400'}`}
          disabled={!results}
        >
          <BarChart3 className="w-3 h-3 inline mr-1" />
          결과
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === 'settings' ? (
          <>
            {/* Location */}
            <WorkspacePanelSection title="위치 설정" icon={<MapPin className="w-3 h-3" />}>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500">위도</label>
                    <input
                      type="number"
                      value={config.latitude}
                      onChange={e => onConfigChange({ latitude: parseFloat(e.target.value) || 37.5665 })}
                      step={0.0001}
                      disabled={isRunning}
                      className="w-full bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">경도</label>
                    <input
                      type="number"
                      value={config.longitude}
                      onChange={e => onConfigChange({ longitude: parseFloat(e.target.value) || 126.978 })}
                      step={0.0001}
                      disabled={isRunning}
                      className="w-full bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 p-1.5"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500">시간대 오프셋</label>
                    <input
                      type="number"
                      value={config.timezone_offset}
                      onChange={e => onConfigChange({ timezone_offset: parseInt(e.target.value) || 9 })}
                      disabled={isRunning}
                      className="w-full bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">표준경선</label>
                    <input
                      type="number"
                      value={config.standard_meridian}
                      onChange={e => onConfigChange({ standard_meridian: parseInt(e.target.value) || 135 })}
                      disabled={isRunning}
                      className="w-full bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 p-1.5"
                    />
                  </div>
                </div>
              </div>
            </WorkspacePanelSection>

            {/* Panel Layer Selection */}
            <WorkspacePanelSection title="패널 레이어" icon={<Layers className="w-3 h-3" />}>
              {layers.length === 0 ? (
                <p className="text-xs text-gray-500">모델을 업로드하면 레이어가 표시됩니다</p>
              ) : (
                <div className="space-y-1">
                  {layers.map(layer => (
                    <label key={layer.id} className="flex items-center gap-2 text-xs text-gray-300 p-1.5 rounded hover:bg-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={layer.isAnalysisTarget}
                        onChange={() => onToggleAnalysisTarget(layer.id)}
                        disabled={isRunning}
                        className="rounded border-gray-600 text-amber-500 focus:ring-amber-500"
                      />
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: layer.color || '#888' }}
                      />
                      {layer.name}
                    </label>
                  ))}
                </div>
              )}
            </WorkspacePanelSection>

            {/* Module Preset */}
            <WorkspacePanelSection title="PV 모듈" icon={<Sun className="w-3 h-3" />}>
              <select
                value={config.module_preset}
                onChange={e => onConfigChange({ module_preset: e.target.value as SolarPVRunConfig['module_preset'] })}
                disabled={isRunning}
                className="w-full bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 p-1.5"
              >
                {Object.entries(MODULE_PRESET_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              {presetInfo && (
                <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px] text-gray-500">
                  <span>출력: {presetInfo.pdc0_w}W</span>
                  <span>효율: {(presetInfo.efficiency * 100).toFixed(1)}%</span>
                  {presetInfo.bifaciality > 0 && (
                    <span className="col-span-2 text-blue-400">이면수광: {(presetInfo.bifaciality * 100).toFixed(0)}%</span>
                  )}
                </div>
              )}
            </WorkspacePanelSection>

            {/* System Settings */}
            <WorkspacePanelSection title="시스템 설정" icon={<Battery className="w-3 h-3" />}>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-gray-500">인버터 효율</label>
                  <input
                    type="number"
                    value={config.inverter_efficiency}
                    onChange={e => onConfigChange({ inverter_efficiency: parseFloat(e.target.value) || 0.96 })}
                    min={0.8} max={1.0} step={0.01}
                    disabled={isRunning}
                    className="w-full bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 p-1.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">손실 프로파일</label>
                  <select
                    value={config.loss_profile}
                    onChange={e => onConfigChange({ loss_profile: e.target.value as SolarPVRunConfig['loss_profile'] })}
                    disabled={isRunning}
                    className="w-full bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 p-1.5"
                  >
                    {Object.entries(LOSS_PROFILE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">지면 반사율 (Albedo)</label>
                  <select
                    value={String(config.ground_albedo)}
                    onChange={e => onConfigChange({ ground_albedo: parseFloat(e.target.value) })}
                    disabled={isRunning}
                    className="w-full bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 p-1.5"
                  >
                    {Object.entries(GROUND_ALBEDO_PRESETS).map(([key, preset]) => (
                      <option key={key} value={String(preset.value)}>{preset.label} ({preset.value})</option>
                    ))}
                  </select>
                </div>
              </div>
            </WorkspacePanelSection>

            {/* Economics */}
            <WorkspacePanelSection title="경제성 분석" icon={<DollarSign className="w-3 h-3" />}>
              <label className="flex items-center gap-2 text-xs text-gray-300 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.economics_enabled}
                  onChange={e => onConfigChange({ economics_enabled: e.target.checked })}
                  disabled={isRunning}
                  className="rounded border-gray-600 text-amber-500 focus:ring-amber-500"
                />
                경제성 분석 포함
              </label>
              {config.economics_enabled && (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-gray-500">전기요금 (원/kWh)</label>
                    <input
                      type="number"
                      value={config.electricity_price_krw}
                      onChange={e => onConfigChange({ electricity_price_krw: parseFloat(e.target.value) || 120 })}
                      disabled={isRunning}
                      className="w-full bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">설치비 (원/kW)</label>
                    <input
                      type="number"
                      value={config.install_cost_krw_per_kw}
                      onChange={e => onConfigChange({ install_cost_krw_per_kw: parseFloat(e.target.value) || 1200000 })}
                      disabled={isRunning}
                      className="w-full bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 p-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">연간 열화율 (%)</label>
                    <input
                      type="number"
                      value={(config.degradation_rate * 100).toFixed(1)}
                      onChange={e => onConfigChange({ degradation_rate: (parseFloat(e.target.value) || 0.5) / 100 })}
                      min={0} max={5} step={0.1}
                      disabled={isRunning}
                      className="w-full bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 p-1.5"
                    />
                  </div>
                </div>
              )}
            </WorkspacePanelSection>
          </>
        ) : results ? (
          <>
            {/* Summary Cards */}
            <WorkspacePanelSection title="요약" icon={<TrendingUp className="w-3 h-3" />}>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-800 rounded-lg p-2">
                  <p className="text-[10px] text-gray-500">총 용량</p>
                  <p className="text-sm font-medium text-white">{results.summary.total_capacity_kwp.toFixed(1)} kWp</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <p className="text-[10px] text-gray-500">연간 발전량</p>
                  <p className="text-sm font-medium text-amber-400">{results.summary.annual_generation_kwh.toLocaleString()} kWh</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <p className="text-[10px] text-gray-500">비발전량</p>
                  <p className="text-sm font-medium text-white">{results.summary.specific_yield_kwh_kwp.toFixed(0)} kWh/kWp</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <p className="text-[10px] text-gray-500">성능비 (PR)</p>
                  <p className="text-sm font-medium text-blue-400">{(results.summary.avg_performance_ratio * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <p className="text-[10px] text-gray-500">이용률 (CF)</p>
                  <p className="text-sm font-medium text-white">{(results.summary.capacity_factor * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <p className="text-[10px] text-gray-500">그림자 손실</p>
                  <p className="text-sm font-medium text-red-400">{results.summary.total_shadow_loss_pct.toFixed(1)}%</p>
                </div>
              </div>
              {results.summary.total_bifacial_gain_kwh > 0 && (
                <div className="mt-2 bg-blue-900/20 border border-blue-800/30 rounded-lg p-2">
                  <p className="text-[10px] text-blue-400">이면수광 추가 발전: +{results.summary.total_bifacial_gain_kwh.toFixed(0)} kWh/yr</p>
                </div>
              )}
            </WorkspacePanelSection>

            {/* Monthly Chart */}
            <WorkspacePanelSection title="월별 발전량" icon={<BarChart3 className="w-3 h-3" />}>
              <div className="flex items-end gap-0.5 h-24">
                {results.monthly_totals.map(mt => {
                  const maxKwh = Math.max(...results.monthly_totals.map(m => m.generation_kwh))
                  const height = maxKwh > 0 ? (mt.generation_kwh / maxKwh) * 100 : 0
                  return (
                    <div key={mt.month} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className="w-full bg-amber-500/80 rounded-t"
                        style={{ height: `${height}%` }}
                        title={`${mt.month}월: ${mt.generation_kwh.toFixed(0)} kWh (그림자 ${mt.avg_shadow_loss_pct.toFixed(0)}%)`}
                      />
                      <span className="text-[8px] text-gray-500">{mt.month}</span>
                    </div>
                  )
                })}
              </div>
            </WorkspacePanelSection>

            {/* Surface Comparison (sorted by score) */}
            <WorkspacePanelSection title="표면 순위" icon={<Award className="w-3 h-3" />}>
              <div className="space-y-1">
                {results.surfaces
                  .sort((a, b) => b.surface_score - a.surface_score)
                  .map((s, i) => (
                    <button
                      key={s.surface_id}
                      onClick={() => onSelectSurface(s.surface_id === selectedSurface ? null : s.surface_id)}
                      className={`w-full text-left p-2 rounded text-xs transition-colors ${
                        s.surface_id === selectedSurface ? 'bg-amber-900/30 border border-amber-600' : 'bg-gray-800 hover:bg-gray-750'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-bold ${scoreColor(s.surface_score)}`}>
                            {s.surface_score.toFixed(0)}
                          </span>
                          <span className="text-gray-300">#{i + 1} {s.surface_id.split('_')[0]}</span>
                        </div>
                        <span className="text-amber-400 font-medium">{s.annual_ac_kwh.toFixed(0)} kWh</span>
                      </div>
                      <div className="flex gap-2 mt-1 text-[10px] text-gray-500">
                        <span>{s.n_modules}모듈</span>
                        <span>{s.capacity_kwp.toFixed(1)}kWp</span>
                        <span>PR {(s.performance_ratio * 100).toFixed(0)}%</span>
                        <span className="text-red-400">{s.shadow_loss_pct.toFixed(0)}%</span>
                      </div>
                      {s.optimal_orientation && s.optimal_orientation.orientation_loss_pct > 5 && (
                        <p className="text-[9px] text-orange-400 mt-0.5">
                          방위 손실 {s.optimal_orientation.orientation_loss_pct.toFixed(0)}%
                          (최적: {s.optimal_orientation.optimal_tilt_deg.toFixed(0)}/{s.optimal_orientation.optimal_azimuth_deg.toFixed(0)})
                        </p>
                      )}
                    </button>
                  ))}
              </div>
            </WorkspacePanelSection>

            {/* Selected Surface Shadow Calendar */}
            {selectedSurfaceData?.shadow_calendar && (
              <WorkspacePanelSection title="Shadow Calendar" icon={<Sun className="w-3 h-3" />}>
                <p className="text-[10px] text-gray-400 mb-1">{selectedSurfaceData.surface_id}</p>
                <ShadowCalendarMini calendar={selectedSurfaceData.shadow_calendar} />
              </WorkspacePanelSection>
            )}

            {/* Economics */}
            {results.economics && (
              <WorkspacePanelSection title="경제성" icon={<DollarSign className="w-3 h-3" />}>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-800 rounded-lg p-2">
                    <p className="text-[10px] text-gray-500">LCOE</p>
                    <p className="text-sm font-medium text-white">{results.economics.lcoe_krw_kwh.toFixed(0)} 원/kWh</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2">
                    <p className="text-[10px] text-gray-500">투자회수</p>
                    <p className="text-sm font-medium text-white">{results.economics.simple_payback_years.toFixed(1)} 년</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2">
                    <p className="text-[10px] text-gray-500">연간 절감</p>
                    <p className="text-sm font-medium text-green-400">{(results.economics.annual_savings_krw / 10000).toFixed(0)} 만원</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2">
                    <p className="text-[10px] text-gray-500">NPV</p>
                    <p className={`text-sm font-medium ${results.economics.npv_krw >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(results.economics.npv_krw / 10000).toFixed(0)} 만원
                    </p>
                  </div>
                </div>

                {/* 25-Year Cashflow Mini Chart */}
                {results.economics.annual_cashflow.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] text-gray-500 mb-1">
                      {results.economics.annual_cashflow.length}년 누적 수익
                    </p>
                    <div className="flex items-end gap-px h-16">
                      {results.economics.annual_cashflow.map(cf => {
                        const maxVal = Math.max(
                          ...results.economics!.annual_cashflow.map(c => Math.abs(c.cumulative_savings_krw))
                        )
                        const pct = maxVal > 0 ? (cf.cumulative_savings_krw / maxVal) * 100 : 0
                        const isPositive = cf.cumulative_savings_krw >= 0
                        return (
                          <div
                            key={cf.year}
                            className="flex-1 flex flex-col justify-end"
                            title={`${cf.year}년: 누적 ${(cf.cumulative_savings_krw / 10000).toFixed(0)}만원 (잔존 ${cf.degraded_capacity_pct.toFixed(1)}%)`}
                          >
                            <div
                              className={`w-full rounded-t-[1px] ${isPositive ? 'bg-green-500/70' : 'bg-red-500/70'}`}
                              style={{ height: `${Math.abs(pct)}%`, minHeight: '1px' }}
                            />
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-between text-[8px] text-gray-600 mt-0.5">
                      <span>1년</span>
                      <span>{results.economics.annual_cashflow.length}년</span>
                    </div>
                  </div>
                )}

                {/* Lifetime generation */}
                {results.economics.lifetime_generation_kwh > 0 && (
                  <p className="text-[10px] text-gray-500 mt-2">
                    수명기간 총 발전: {(results.economics.lifetime_generation_kwh / 1000).toFixed(0)} MWh
                  </p>
                )}
              </WorkspacePanelSection>
            )}

            {/* CO2 Reduction */}
            {results.economics?.co2_reduction && (
              <WorkspacePanelSection title="탄소 저감" icon={<Leaf className="w-3 h-3" />}>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-2">
                    <p className="text-[10px] text-gray-500">연간 CO2 저감</p>
                    <p className="text-sm font-medium text-green-400">
                      {(results.economics.co2_reduction.annual_co2_reduction_kg / 1000).toFixed(2)} tCO2
                    </p>
                  </div>
                  <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-2">
                    <p className="text-[10px] text-gray-500">수명기간 총</p>
                    <p className="text-sm font-medium text-green-400">
                      {results.economics.co2_reduction.lifetime_co2_reduction_ton.toFixed(1)} tCO2
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                  <TreePine className="w-3 h-3 text-green-500" />
                  소나무 {results.economics.co2_reduction.equivalent_trees.toLocaleString()}그루에 해당
                </div>
              </WorkspacePanelSection>
            )}

            {/* Report Download */}
            <WorkspacePanelSection title="보고서" icon={<FileDown className="w-4 h-4" />} defaultOpen>
              {reportDownloadUrl ? (
                <a
                  href={reportDownloadUrl}
                  download
                  className="w-full py-2 bg-green-700 hover:bg-green-600 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Excel 보고서 다운로드
                </a>
              ) : isGeneratingReport ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  보고서 생성 중...
                </div>
              ) : onGenerateReport ? (
                <button
                  onClick={onGenerateReport}
                  className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  보고서 생성
                </button>
              ) : null}
            </WorkspacePanelSection>
          </>
        ) : (
          <div className="text-center text-gray-500 text-sm py-8">
            분석을 실행하면 결과가 표시됩니다
          </div>
        )}
      </div>

      {/* Footer: Analysis Control */}
      <div className="p-3 border-t border-gray-800">
        {error && (
          <div className="mb-2 p-2 bg-red-900/30 border border-red-800 rounded text-xs text-red-300 flex items-start gap-1">
            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}
        {isRunning ? (
          <button
            onClick={onCancelAnalysis}
            className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            분석 취소
          </button>
        ) : (
          <button
            onClick={onStartAnalysis}
            disabled={layers.length > 0 && !layers.some(l => l.isAnalysisTarget)}
            className="w-full py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            발전량 분석 시작
          </button>
        )}
      </div>
    </div>
  )
}
