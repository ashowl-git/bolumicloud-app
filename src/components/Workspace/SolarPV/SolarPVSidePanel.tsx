'use client'

import { useMemo } from 'react'
import {
  Settings, BarChart3,
  Zap, Sun, DollarSign, AlertCircle, Loader2,
  TrendingUp, Battery, MapPin,
  Leaf, Award, TreePine, FileDown, Grid3X3,
} from 'lucide-react'
import type {
  SolarPVRunConfig, SolarPVResult, SolarPVProgress,
  PVModulePresetInfo, ShadowCalendar,
} from '@/lib/types/solar-pv'
import { MODULE_PRESET_LABELS, LOSS_PROFILE_LABELS, GROUND_ALBEDO_PRESETS } from '@/lib/types/solar-pv'
import type { LayerConfig } from '@/lib/types/sunlight'
import type { PanelTab } from '../hooks/useWorkspaceLayout'
import WorkspaceSidePanel from '../WorkspaceSidePanel'
import WorkspacePanelSection from '../WorkspacePanelSection'
import LayerPanel from '../Sunlight/LayerPanel'

interface SolarPVSidePanelProps {
  open: boolean
  onClose: () => void
  onOpen: () => void
  config: SolarPVRunConfig
  onConfigChange: (partial: Partial<SolarPVRunConfig>) => void
  layers: LayerConfig[]
  onToggleLayerVisibility: (id: string) => void
  onToggleAnalysisTarget: (id: string) => void
  onToggleAllLayers?: (visible: boolean) => void
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

// --- Surface Score 색상 (라이트 테마) ---
function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

// --- Shadow Calendar 미니 히트맵 ---
function ShadowCalendarMini({ calendar }: { calendar: ShadowCalendar }) {
  return (
    <div className="mt-2">
      <p className="text-[10px] text-gray-500 mb-1">Shadow Calendar (월 x 시)</p>
      <div className="flex flex-col gap-px">
        {calendar.matrix.map((row, mi) => (
          <div key={mi} className="flex gap-px items-center">
            <span className="text-[7px] text-gray-500 w-3 text-right">{mi + 1}</span>
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
            <span key={h} className="text-[7px] text-gray-500" style={{ width: `${3 * 12}px` }}>{h}</span>
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
  layers, onToggleLayerVisibility, onToggleAnalysisTarget, onToggleAllLayers,
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

  const noPanelSelected = layers.length > 0 && !layers.some(l => l.isAnalysisTarget)

  const footer = (
    <div className="space-y-1.5">
      {error && !isRunning && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 text-xs text-red-700">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <p className="flex-1 leading-relaxed">{error}</p>
        </div>
      )}
      {isRunning ? (
        <button
          onClick={onCancelAnalysis}
          className="w-full flex items-center justify-center gap-2 border border-red-300 text-red-600 py-2.5 text-sm
            transition-all duration-300 hover:border-red-500 hover:bg-red-50"
        >
          <Loader2 size={14} className="animate-spin" />
          분석 취소
        </button>
      ) : (
        <button
          onClick={onStartAnalysis}
          disabled={noPanelSelected}
          title={noPanelSelected ? '분석 대상 레이어를 선택하세요' : undefined}
          className={`w-full flex items-center justify-center gap-2 border py-2.5 text-sm
            transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed
            ${error
              ? 'border-red-300 text-red-600 hover:border-red-500 hover:bg-red-50'
              : 'border-gray-200 text-gray-900 hover:border-amber-500/50 hover:text-amber-700'
            }`}
        >
          <Zap size={14} />
          {error ? '재시도' : results ? '재분석' : '발전량 분석 시작'}
        </button>
      )}
      {noPanelSelected && !isRunning && !error && (
        <p className="text-[10px] text-gray-500 text-center">
          패널 레이어를 1개 이상 선택하세요
        </p>
      )}
    </div>
  )

  return (
    <WorkspaceSidePanel
      title="태양광 발전 분석"
      open={open}
      onClose={onClose}
      onOpen={onOpen}
      footer={footer}
    >
      {/* Tab bar */}
      <div className="flex border border-gray-200 rounded overflow-hidden mb-2">
        <button
          onClick={() => onTabChange('settings')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs transition-colors
            ${activeTab === 'settings'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
        >
          <Settings size={12} />
          설정
        </button>
        <button
          onClick={() => onTabChange('results')}
          disabled={!results}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
            ${activeTab === 'results'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
        >
          <BarChart3 size={12} />
          결과
        </button>
      </div>

      {/* Settings tab */}
      {activeTab === 'settings' && (
        <>
          {/* Location */}
          <WorkspacePanelSection title="위치 설정" icon={<MapPin size={14} />}>
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
                    className="w-full border border-gray-200 rounded text-xs text-gray-900 p-1.5 disabled:opacity-50"
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
                    className="w-full border border-gray-200 rounded text-xs text-gray-900 p-1.5 disabled:opacity-50"
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
                    className="w-full border border-gray-200 rounded text-xs text-gray-900 p-1.5 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">표준경선</label>
                  <input
                    type="number"
                    value={config.standard_meridian}
                    onChange={e => onConfigChange({ standard_meridian: parseInt(e.target.value) || 135 })}
                    disabled={isRunning}
                    className="w-full border border-gray-200 rounded text-xs text-gray-900 p-1.5 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </WorkspacePanelSection>

          {/* Layer management */}
          {layers.length > 0 && (
            <WorkspacePanelSection
              title="레이어"
              icon={<Grid3X3 size={14} />}
              badge={layers.length}
            >
              <LayerPanel
                layers={layers}
                onToggleVisibility={onToggleLayerVisibility}
                onToggleAnalysisTarget={onToggleAnalysisTarget}
                onToggleAll={onToggleAllLayers}
              />
              <p className="text-[9px] text-gray-400 mt-2">
                <span className="text-red-500">*</span> = 패널 레이어 (발전량 분석 대상) &nbsp;|&nbsp;
                <span className="text-gray-500">눈</span> = 3D 표시 + 그림자 포함
              </p>
            </WorkspacePanelSection>
          )}

          {/* Module Preset */}
          <WorkspacePanelSection title="PV 모듈" icon={<Sun size={14} />}>
            <select
              value={config.module_preset}
              onChange={e => onConfigChange({ module_preset: e.target.value as SolarPVRunConfig['module_preset'] })}
              disabled={isRunning}
              className="w-full border border-gray-200 rounded text-xs text-gray-900 p-1.5 disabled:opacity-50"
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
                  <span className="col-span-2 text-blue-600">이면수광: {(presetInfo.bifaciality * 100).toFixed(0)}%</span>
                )}
              </div>
            )}
          </WorkspacePanelSection>

          {/* System Settings */}
          <WorkspacePanelSection title="시스템 설정" icon={<Battery size={14} />} defaultOpen={false}>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-gray-500">인버터 효율</label>
                <input
                  type="number"
                  value={config.inverter_efficiency}
                  onChange={e => onConfigChange({ inverter_efficiency: parseFloat(e.target.value) || 0.96 })}
                  min={0.8} max={1.0} step={0.01}
                  disabled={isRunning}
                  className="w-full border border-gray-200 rounded text-xs text-gray-900 p-1.5 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">손실 프로파일</label>
                <select
                  value={config.loss_profile}
                  onChange={e => onConfigChange({ loss_profile: e.target.value as SolarPVRunConfig['loss_profile'] })}
                  disabled={isRunning}
                  className="w-full border border-gray-200 rounded text-xs text-gray-900 p-1.5 disabled:opacity-50"
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
                  className="w-full border border-gray-200 rounded text-xs text-gray-900 p-1.5 disabled:opacity-50"
                >
                  {Object.entries(GROUND_ALBEDO_PRESETS).map(([key, preset]) => (
                    <option key={key} value={String(preset.value)}>{preset.label} ({preset.value})</option>
                  ))}
                </select>
              </div>
            </div>
          </WorkspacePanelSection>

          {/* Economics */}
          <WorkspacePanelSection title="경제성 분석" icon={<DollarSign size={14} />} defaultOpen={false}>
            <label className="flex items-center gap-2 text-xs text-gray-700 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.economics_enabled}
                onChange={e => onConfigChange({ economics_enabled: e.target.checked })}
                disabled={isRunning}
                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
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
                    className="w-full border border-gray-200 rounded text-xs text-gray-900 p-1.5 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">설치비 (원/kW)</label>
                  <input
                    type="number"
                    value={config.install_cost_krw_per_kw}
                    onChange={e => onConfigChange({ install_cost_krw_per_kw: parseFloat(e.target.value) || 1200000 })}
                    disabled={isRunning}
                    className="w-full border border-gray-200 rounded text-xs text-gray-900 p-1.5 disabled:opacity-50"
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
                    className="w-full border border-gray-200 rounded text-xs text-gray-900 p-1.5 disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </WorkspacePanelSection>
        </>
      )}

      {/* Results tab */}
      {activeTab === 'results' && results ? (
        <>
          {/* Summary Cards */}
          <WorkspacePanelSection title="요약" icon={<TrendingUp size={14} />}>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                <p className="text-[10px] text-gray-500">총 용량</p>
                <p className="text-sm font-semibold text-gray-900">{results.summary.total_capacity_kwp.toFixed(1)} kWp</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                <p className="text-[10px] text-amber-600">연간 발전량</p>
                <p className="text-sm font-semibold text-amber-700">{results.summary.annual_generation_kwh.toLocaleString()} kWh</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                <p className="text-[10px] text-gray-500">비발전량</p>
                <p className="text-sm font-semibold text-gray-900">{results.summary.specific_yield_kwh_kwp.toFixed(0)} kWh/kWp</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                <p className="text-[10px] text-blue-600">성능비 (PR)</p>
                <p className="text-sm font-semibold text-blue-700">{(results.summary.avg_performance_ratio * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                <p className="text-[10px] text-gray-500">이용률 (CF)</p>
                <p className="text-sm font-semibold text-gray-900">{(results.summary.capacity_factor * 100).toFixed(1)}%</p>
              </div>
              <div className="bg-red-50 rounded-lg p-2 border border-red-100">
                <p className="text-[10px] text-red-600">그림자 손실</p>
                <p className="text-sm font-semibold text-red-700">{results.summary.total_shadow_loss_pct.toFixed(1)}%</p>
              </div>
            </div>
            {results.summary.total_bifacial_gain_kwh > 0 && (
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-[10px] text-blue-700">이면수광 추가 발전: +{results.summary.total_bifacial_gain_kwh.toFixed(0)} kWh/yr</p>
              </div>
            )}
          </WorkspacePanelSection>

          {/* Monthly Chart */}
          <WorkspacePanelSection title="월별 발전량" icon={<BarChart3 size={14} />}>
            <div className="flex items-end gap-0.5 h-24">
              {results.monthly_totals.map(mt => {
                const maxKwh = Math.max(...results.monthly_totals.map(m => m.generation_kwh))
                const height = maxKwh > 0 ? (mt.generation_kwh / maxKwh) * 100 : 0
                return (
                  <div key={mt.month} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className="w-full bg-amber-400 rounded-t"
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
          <WorkspacePanelSection title="표면 순위" icon={<Award size={14} />}>
            <div className="space-y-1">
              {[...results.surfaces]
                .sort((a, b) => b.surface_score - a.surface_score)
                .map((s, i) => (
                  <button
                    key={s.surface_id}
                    onClick={() => onSelectSurface(s.surface_id === selectedSurface ? null : s.surface_id)}
                    className={`w-full text-left p-2 rounded text-xs transition-colors border ${
                      s.surface_id === selectedSurface
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold ${scoreColor(s.surface_score)}`}>
                          {s.surface_score.toFixed(0)}
                        </span>
                        <span className="text-gray-700">#{i + 1} {s.surface_id.split('_')[0]}</span>
                      </div>
                      <span className="text-amber-700 font-medium">{s.annual_ac_kwh.toFixed(0)} kWh</span>
                    </div>
                    <div className="flex gap-2 mt-1 text-[10px] text-gray-500">
                      <span>{s.n_modules}모듈</span>
                      <span>{s.capacity_kwp.toFixed(1)}kWp</span>
                      <span>PR {(s.performance_ratio * 100).toFixed(0)}%</span>
                      <span className="text-red-500">그림자 {s.shadow_loss_pct.toFixed(0)}%</span>
                    </div>
                    {s.optimal_orientation && s.optimal_orientation.orientation_loss_pct > 5 && (
                      <p className="text-[9px] text-orange-600 mt-0.5">
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
            <WorkspacePanelSection title="Shadow Calendar" icon={<Sun size={14} />}>
              <p className="text-[10px] text-gray-500 mb-1">{selectedSurfaceData.surface_id}</p>
              <ShadowCalendarMini calendar={selectedSurfaceData.shadow_calendar} />
            </WorkspacePanelSection>
          )}

          {/* Economics */}
          {results.economics && (
            <WorkspacePanelSection title="경제성" icon={<DollarSign size={14} />}>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                  <p className="text-[10px] text-gray-500">LCOE</p>
                  <p className="text-sm font-semibold text-gray-900">{results.economics.lcoe_krw_kwh.toFixed(0)} 원/kWh</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                  <p className="text-[10px] text-gray-500">투자회수</p>
                  <p className="text-sm font-semibold text-gray-900">{results.economics.simple_payback_years.toFixed(1)} 년</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2 border border-green-100">
                  <p className="text-[10px] text-green-600">연간 절감</p>
                  <p className="text-sm font-semibold text-green-700">{(results.economics.annual_savings_krw / 10000).toFixed(0)} 만원</p>
                </div>
                <div className={`rounded-lg p-2 border ${
                  results.economics.npv_krw >= 0
                    ? 'bg-green-50 border-green-100'
                    : 'bg-red-50 border-red-100'
                }`}>
                  <p className="text-[10px] text-gray-500">NPV</p>
                  <p className={`text-sm font-semibold ${results.economics.npv_krw >= 0 ? 'text-green-700' : 'text-red-700'}`}>
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
                  <div className="flex items-end gap-px h-16 bg-gray-50 rounded p-1">
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
                            className={`w-full rounded-t-[1px] ${isPositive ? 'bg-green-400' : 'bg-red-400'}`}
                            style={{ height: `${Math.abs(pct)}%`, minHeight: '1px' }}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between text-[8px] text-gray-400 mt-0.5">
                    <span>1년</span>
                    <span>{results.economics.annual_cashflow.length}년</span>
                  </div>
                </div>
              )}

              {results.economics.lifetime_generation_kwh > 0 && (
                <p className="text-[10px] text-gray-500 mt-2">
                  수명기간 총 발전: {(results.economics.lifetime_generation_kwh / 1000).toFixed(0)} MWh
                </p>
              )}
            </WorkspacePanelSection>
          )}

          {/* CO2 Reduction */}
          {results.economics?.co2_reduction && (
            <WorkspacePanelSection title="탄소 저감" icon={<Leaf size={14} />}>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 border border-green-100 rounded-lg p-2">
                  <p className="text-[10px] text-green-600">연간 CO2 저감</p>
                  <p className="text-sm font-semibold text-green-700">
                    {(results.economics.co2_reduction.annual_co2_reduction_kg / 1000).toFixed(2)} tCO2
                  </p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-lg p-2">
                  <p className="text-[10px] text-green-600">수명기간 총</p>
                  <p className="text-sm font-semibold text-green-700">
                    {results.economics.co2_reduction.lifetime_co2_reduction_ton.toFixed(1)} tCO2
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                <TreePine className="w-3 h-3 text-green-600" />
                소나무 {results.economics.co2_reduction.equivalent_trees.toLocaleString()}그루에 해당
              </div>
            </WorkspacePanelSection>
          )}

          {/* Report Download */}
          <WorkspacePanelSection title="보고서" icon={<FileDown size={14} />}>
            {reportDownloadUrl ? (
              <a
                href={reportDownloadUrl}
                download
                className="w-full py-2 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FileDown className="w-3.5 h-3.5" />
                Excel 보고서 다운로드
              </a>
            ) : isGeneratingReport ? (
              <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                보고서 생성 중...
              </div>
            ) : onGenerateReport ? (
              <button
                onClick={onGenerateReport}
                className="w-full py-2 border border-gray-200 hover:border-gray-400 text-gray-700 text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FileDown className="w-3.5 h-3.5" />
                보고서 생성
              </button>
            ) : null}
          </WorkspacePanelSection>
        </>
      ) : activeTab === 'results' ? (
        <div className="text-center text-gray-500 text-sm py-8">
          분석을 실행하면 결과가 표시됩니다
        </div>
      ) : null}
    </WorkspaceSidePanel>
  )
}
