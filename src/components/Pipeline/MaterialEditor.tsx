'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MaterialOverride } from '@/lib/types/pipeline'
import type { RadianceMaterialType } from '@/lib/types/pipeline'

interface MaterialEditorProps {
  apiUrl: string
  sessionId: string
  overrides: Record<string, MaterialOverride>
  onChange: (overrides: Record<string, MaterialOverride>) => void
  disabled?: boolean
}

// --- Glass category & preset types ---
type GlassCategory = 'single' | 'double' | 'triple' | 'reflective' | 'special'

const GLASS_CATEGORY_LABELS: Record<GlassCategory, string> = {
  single: '단판',
  double: '복층',
  triple: '삼중',
  reflective: '반사',
  special: '기능성',
}

interface EnhancedGlassPreset {
  label: string
  category: GlassCategory
  vlt: number       // Visible Light Transmittance (0-1)
  vlr: number       // Visible Light Reflectance (0-1) -- key for glare
  shgc: number      // Solar Heat Gain Coefficient
  r: number; g: number; b: number  // Radiance RGB color
  transmissivity: number  // Radiance transmissivity parameter
  specularity: number
  note?: string
}

// Reference values based on typical glass specifications.
// Actual values should be confirmed with manufacturer data sheets.
const ENHANCED_GLASS_PRESETS: EnhancedGlassPreset[] = [
  // --- Single pane ---
  { label: '투명 6mm', category: 'single',
    vlt: 0.88, vlr: 0.08, shgc: 0.82,
    r: 0.96, g: 0.96, b: 0.96, transmissivity: 0.96, specularity: 0.08 },
  { label: '투명 10mm', category: 'single',
    vlt: 0.84, vlr: 0.08, shgc: 0.78,
    r: 0.93, g: 0.93, b: 0.93, transmissivity: 0.92, specularity: 0.08 },
  { label: '브론즈 6mm', category: 'single',
    vlt: 0.55, vlr: 0.06, shgc: 0.62,
    r: 0.75, g: 0.60, b: 0.45, transmissivity: 0.60, specularity: 0.06 },
  { label: '그레이 6mm', category: 'single',
    vlt: 0.50, vlr: 0.06, shgc: 0.56,
    r: 0.65, g: 0.65, b: 0.65, transmissivity: 0.55, specularity: 0.06 },
  { label: '그린 6mm', category: 'single',
    vlt: 0.75, vlr: 0.07, shgc: 0.60,
    r: 0.55, g: 0.85, b: 0.60, transmissivity: 0.82, specularity: 0.07 },
  { label: '블루 6mm', category: 'single',
    vlt: 0.60, vlr: 0.06, shgc: 0.55,
    r: 0.50, g: 0.60, b: 0.85, transmissivity: 0.66, specularity: 0.06 },

  // --- Double glazing ---
  { label: '투명 복층 (6+12+6)', category: 'double',
    vlt: 0.78, vlr: 0.14, shgc: 0.70,
    r: 0.90, g: 0.90, b: 0.90, transmissivity: 0.85, specularity: 0.12 },
  { label: 'Low-E 복층', category: 'double',
    vlt: 0.65, vlr: 0.15, shgc: 0.37,
    r: 0.82, g: 0.82, b: 0.82, transmissivity: 0.71, specularity: 0.12 },
  { label: '고성능 Low-E 복층', category: 'double',
    vlt: 0.55, vlr: 0.18, shgc: 0.27,
    r: 0.75, g: 0.75, b: 0.78, transmissivity: 0.60, specularity: 0.15 },
  { label: '착색 Low-E 복층', category: 'double',
    vlt: 0.42, vlr: 0.12, shgc: 0.25,
    r: 0.60, g: 0.55, b: 0.50, transmissivity: 0.46, specularity: 0.12 },

  // --- Triple glazing ---
  { label: 'Low-E 삼중', category: 'triple',
    vlt: 0.50, vlr: 0.22, shgc: 0.25,
    r: 0.71, g: 0.71, b: 0.71, transmissivity: 0.55, specularity: 0.15 },
  { label: '고단열 삼중 (패시브)', category: 'triple',
    vlt: 0.40, vlr: 0.25, shgc: 0.20,
    r: 0.64, g: 0.64, b: 0.64, transmissivity: 0.44, specularity: 0.18 },

  // --- Reflective ---
  { label: '실버 반사유리', category: 'reflective',
    vlt: 0.20, vlr: 0.40, shgc: 0.17,
    r: 0.45, g: 0.45, b: 0.50, transmissivity: 0.22, specularity: 0.35,
    note: '외부 반사 현휘 위험' },
  { label: '골드 반사유리', category: 'reflective',
    vlt: 0.30, vlr: 0.35, shgc: 0.25,
    r: 0.55, g: 0.50, b: 0.35, transmissivity: 0.33, specularity: 0.30,
    note: '외부 반사 현휘 주의' },
  { label: '블루 반사유리', category: 'reflective',
    vlt: 0.25, vlr: 0.30, shgc: 0.22,
    r: 0.35, g: 0.45, b: 0.65, transmissivity: 0.27, specularity: 0.25 },

  // --- Special ---
  { label: '전기변색 (투명)', category: 'special',
    vlt: 0.60, vlr: 0.10, shgc: 0.46,
    r: 0.78, g: 0.78, b: 0.82, transmissivity: 0.66, specularity: 0.08,
    note: 'Electrochromic - 투명 상태' },
  { label: '전기변색 (착색)', category: 'special',
    vlt: 0.01, vlr: 0.12, shgc: 0.09,
    r: 0.15, g: 0.15, b: 0.20, transmissivity: 0.01, specularity: 0.10,
    note: 'Electrochromic - 착색 상태' },
]

// --- Glare risk classification ---
interface GlareRisk {
  level: string
  color: string
  bgColor: string
  desc: string
}

function getGlareRisk(vlr: number): GlareRisk {
  if (vlr >= 0.30) {
    return {
      level: '매우 높음',
      color: 'text-red-700',
      bgColor: 'bg-red-50 border-red-200',
      desc: '심각한 반사 현휘 유발 -- 주변 건물/도로에 영향',
    }
  }
  if (vlr >= 0.20) {
    return {
      level: '높음',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
      desc: '반사 현휘 주의 -- 특정 시간대 눈부심 발생 가능',
    }
  }
  if (vlr >= 0.12) {
    return {
      level: '보통',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200',
      desc: '일반적 수준 -- 직사 조건에서 일부 현휘 가능',
    }
  }
  return {
    level: '낮음',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    desc: '현휘 위험 낮음',
  }
}

// Estimate VLR when no preset is selected.
// Uses specularity as proxy; for clear glass (n=1.52) base R ~ 8%.
function estimateVLR(specularity: number): number {
  return Math.max(0.08, specularity)
}

// --- Helpers ---
function colorToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { r: 0.5, g: 0.5, b: 0.5 }
  return {
    r: Math.round((parseInt(result[1], 16) / 255) * 1000) / 1000,
    g: Math.round((parseInt(result[2], 16) / 255) * 1000) / 1000,
    b: Math.round((parseInt(result[3], 16) / 255) * 1000) / 1000,
  }
}

function autoType(mat: MaterialOverride): RadianceMaterialType {
  if (mat.transmissivity > 0) {
    return mat.trans_specular >= 0.9 ? 'glass' : 'trans'
  }
  return mat.mat_type === 'metal' ? 'metal' : 'plastic'
}

function typeLabel(mat: MaterialOverride): string {
  const t = autoType(mat)
  switch (t) {
    case 'plastic': return '불투명'
    case 'metal': return '금속'
    case 'trans': return '반투명 (확산)'
    case 'glass': return '투명 유리'
  }
}

export default function MaterialEditor({
  apiUrl,
  sessionId,
  overrides,
  onChange,
  disabled,
}: MaterialEditorProps) {
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [glassCategory, setGlassCategory] = useState<GlassCategory | 'all'>('all')
  const [showReference, setShowReference] = useState(false)
  // Track which preset each material is using (for accurate VLR/SHGC display)
  const [presetInfo, setPresetInfo] = useState<Record<string, EnhancedGlassPreset | null>>({})

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    fetch(`${apiUrl}/pipeline/materials/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        const mats: MaterialOverride[] = data.materials || []
        if (Object.keys(overrides).length === 0 && mats.length > 0) {
          const initial: Record<string, MaterialOverride> = {}
          for (const m of mats) {
            initial[m.name] = { ...m }
          }
          onChange(initial)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [apiUrl, sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdate = useCallback((name: string, partial: Partial<MaterialOverride>) => {
    const current = overrides[name]
    if (!current) return
    const updated = { ...current, ...partial }
    updated.mat_type = autoType(updated)
    onChange({ ...overrides, [name]: updated })

    // Clear preset reference when key optical property changes manually
    if ('transmissivity' in partial || 'specularity' in partial) {
      setPresetInfo(prev => ({ ...prev, [name]: null }))
    }
  }, [overrides, onChange])

  const handleColorChange = useCallback((name: string, hex: string) => {
    const { r, g, b } = hexToRgb(hex)
    handleUpdate(name, { r, g, b })
  }, [handleUpdate])

  const applyGlassPreset = useCallback((name: string, preset: EnhancedGlassPreset) => {
    handleUpdate(name, {
      r: preset.r,
      g: preset.g,
      b: preset.b,
      transmissivity: preset.transmissivity,
      specularity: preset.specularity,
      roughness: 0,
      trans_specular: 1.0,
    })
    setPresetInfo(prev => ({ ...prev, [name]: preset }))
  }, [handleUpdate])

  const toggleMetal = useCallback((name: string) => {
    const current = overrides[name]
    if (!current) return
    const isMetal = current.mat_type === 'metal'
    handleUpdate(name, { mat_type: isMetal ? 'plastic' : 'metal' })
  }, [overrides, handleUpdate])

  const matList = Object.values(overrides)

  const filteredPresets = glassCategory === 'all'
    ? ENHANCED_GLASS_PRESETS
    : ENHANCED_GLASS_PRESETS.filter(p => p.category === glassCategory)

  if (loading) {
    return (
      <div className="border border-gray-200 p-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">재질 정보 로딩 중...</span>
        </div>
      </div>
    )
  }

  if (matList.length === 0) return null

  return (
    <div className="border border-gray-200 p-6">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-sm font-medium text-gray-900">
          재질 편집 ({matList.length}개)
        </h3>
        <span className="text-xs text-gray-500">
          {expanded ? '접기' : '펼치기'}
        </span>
      </button>

      {!expanded && (
        <p className="text-xs text-gray-400 mt-2">
          {matList.length}개 재질 감지됨. 색상, 투과율, 반사율 등을 수정할 수 있습니다.
        </p>
      )}

      {expanded && (
        <div className="mt-4 space-y-2">
          {matList.map((mat, idx) => {
            const isEditing = editingIdx === idx
            const hex = colorToHex(mat.r, mat.g, mat.b)
            const isTranslucent = mat.transmissivity > 0
            const isMetal = mat.mat_type === 'metal'

            // Optical properties
            const activePreset = presetInfo[mat.name]
            const vlr = activePreset ? activePreset.vlr : estimateVLR(mat.specularity)
            // Approximate VLT from Radiance transmissivity (single pane: T_vis ~ t * 0.915)
            const vlt = activePreset ? activePreset.vlt : mat.transmissivity * 0.915
            const vla = Math.max(0, 1 - vlt - vlr)
            const shgc = activePreset?.shgc
            const glareRisk = getGlareRisk(vlr)

            return (
              <div key={mat.name} className="border border-gray-100">
                {/* Row header */}
                <button
                  type="button"
                  onClick={() => setEditingIdx(isEditing ? null : idx)}
                  disabled={disabled}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div
                    className="w-6 h-6 border border-gray-300 flex-shrink-0"
                    style={{
                      backgroundColor: hex,
                      opacity: isTranslucent ? 0.5 + (1 - mat.transmissivity) * 0.5 : 1,
                    }}
                  />
                  <span className="text-sm font-mono text-gray-700 flex-1 truncate">{mat.name}</span>
                  <span className="text-xs text-gray-500 border border-gray-200 px-2 py-0.5">
                    {typeLabel(mat)}
                  </span>
                  {/* Glare risk mini badge on header for glass materials */}
                  {isTranslucent && (
                    <span className={`text-[10px] px-1.5 py-0.5 border ${glareRisk.bgColor} ${glareRisk.color}`}>
                      R{(vlr * 100).toFixed(0)}%
                    </span>
                  )}
                  <span className="text-gray-400 text-xs">{isEditing ? '▲' : '▼'}</span>
                </button>

                {/* Editor panel */}
                {isEditing && (
                  <div className="border-t border-gray-100 p-4 space-y-5 bg-gray-50/50">
                    {/* 1. Color */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">
                        색상 (R:{mat.r.toFixed(2)} G:{mat.g.toFixed(2)} B:{mat.b.toFixed(2)})
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={hex}
                          onChange={(e) => handleColorChange(mat.name, e.target.value)}
                          disabled={disabled}
                          className="w-10 h-8 border border-gray-200 cursor-pointer disabled:opacity-50"
                        />
                        <input
                          type="text"
                          value={hex}
                          onChange={(e) => handleColorChange(mat.name, e.target.value)}
                          disabled={disabled}
                          className="w-24 border border-gray-200 px-2 py-1 text-xs font-mono
                            focus:outline-none focus:border-gray-400 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* 2. Metal toggle */}
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-500">금속 재질</label>
                      <button
                        type="button"
                        onClick={() => toggleMetal(mat.name)}
                        disabled={disabled || isTranslucent}
                        className={`px-3 py-1 text-xs border transition-all ${
                          isMetal
                            ? 'border-red-600 text-red-600 bg-red-50'
                            : 'border-gray-200 text-gray-500 hover:border-gray-400'
                        } disabled:opacity-50`}
                      >
                        {isMetal ? 'ON' : 'OFF'}
                      </button>
                      {isTranslucent && (
                        <span className="text-[10px] text-gray-400">{'투과율 > 0이면 금속 불가'}</span>
                      )}
                    </div>

                    {/* 3. Specularity + Roughness */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1.5 block">
                          경면 반사: {mat.specularity.toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min={0} max={1} step={0.01}
                          value={mat.specularity}
                          onChange={(e) => handleUpdate(mat.name, { specularity: Number(e.target.value) })}
                          disabled={disabled}
                          className="w-full accent-red-600"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                          <span>무광</span><span>고광택</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1.5 block">
                          거칠기: {mat.roughness.toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min={0} max={1} step={0.01}
                          value={mat.roughness}
                          onChange={(e) => handleUpdate(mat.name, { roughness: Number(e.target.value) })}
                          disabled={disabled}
                          className="w-full accent-red-600"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                          <span>매끈</span><span>거친</span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Transmissivity */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">
                        투과율: {mat.transmissivity.toFixed(2)}
                        {mat.transmissivity === 0 && ' (불투명)'}
                        {mat.transmissivity > 0 && mat.transmissivity < 0.5 && ' (반투명)'}
                        {mat.transmissivity >= 0.5 && ' (투명)'}
                      </label>
                      <input
                        type="range"
                        min={0} max={1} step={0.01}
                        value={mat.transmissivity}
                        onChange={(e) => handleUpdate(mat.name, { transmissivity: Number(e.target.value) })}
                        disabled={disabled}
                        className="w-full accent-red-600"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                        <span>불투명 (벽, 바닥)</span><span>완전 투명 (유리)</span>
                      </div>
                    </div>

                    {/* ===== 5. Optical Properties Panel (T/R/A) ===== */}
                    {isTranslucent && (
                      <div className="border border-gray-200 bg-white p-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-gray-700">
                            광학 특성 (T + R + A = 1)
                          </label>
                          {activePreset ? (
                            <span className="text-[10px] text-gray-400">
                              프리셋: {activePreset.label}
                            </span>
                          ) : (
                            <span className="text-[10px] text-orange-400">
                              추정값 -- 프리셋 선택 시 정확한 값 표시
                            </span>
                          )}
                        </div>

                        {/* T/R/A Stacked bar */}
                        <div className="flex h-7 w-full overflow-hidden border border-gray-200">
                          <div
                            className="bg-sky-400/80 flex items-center justify-center transition-all"
                            style={{ width: `${vlt * 100}%` }}
                          >
                            {vlt >= 0.12 && (
                              <span className="text-[9px] text-white font-medium drop-shadow-sm">
                                T {(vlt * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                          <div
                            className="bg-red-400/80 flex items-center justify-center transition-all"
                            style={{ width: `${vlr * 100}%` }}
                          >
                            {vlr >= 0.06 && (
                              <span className="text-[9px] text-white font-medium drop-shadow-sm">
                                R {(vlr * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                          <div
                            className="bg-gray-400/60 flex items-center justify-center transition-all"
                            style={{ width: `${vla * 100}%` }}
                          >
                            {vla >= 0.06 && (
                              <span className="text-[9px] text-white font-medium drop-shadow-sm">
                                A {(vla * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Legend row */}
                        <div className="flex gap-4 mt-1.5">
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <span className="w-2 h-2 bg-sky-400/80 inline-block" /> 투과 (T)
                          </span>
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <span className="w-2 h-2 bg-red-400/80 inline-block" /> 반사 (R)
                          </span>
                          <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <span className="w-2 h-2 bg-gray-400/60 inline-block" /> 흡수 (A)
                          </span>
                          {shgc !== undefined && (
                            <span className="text-[10px] text-gray-500 ml-auto font-mono">
                              SHGC {shgc.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Glare risk indicator */}
                        <div className={`mt-2 p-2 border text-xs ${glareRisk.bgColor}`}>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${glareRisk.color}`}>
                              현휘 위험도: {glareRisk.level}
                            </span>
                            <span className="text-gray-500">
                              (VLR {(vlr * 100).toFixed(0)}%)
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {glareRisk.desc}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 6. Trans specular */}
                    {isTranslucent && (
                      <div>
                        <label className="text-xs text-gray-500 mb-1.5 block">
                          투과 선명도: {mat.trans_specular.toFixed(2)}
                          {mat.trans_specular >= 0.9 && ' (투명 유리)'}
                          {mat.trans_specular >= 0.5 && mat.trans_specular < 0.9 && ' (반투명)'}
                          {mat.trans_specular < 0.5 && ' (불투명 유리/스크린)'}
                        </label>
                        <input
                          type="range"
                          min={0} max={1} step={0.01}
                          value={mat.trans_specular}
                          onChange={(e) => handleUpdate(mat.name, { trans_specular: Number(e.target.value) })}
                          disabled={disabled}
                          className="w-full accent-red-600"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                          <span>확산 (frosted glass)</span><span>직진 투과 (clear glass)</span>
                        </div>
                      </div>
                    )}

                    {/* ===== 7. Enhanced Glass Presets with category tabs ===== */}
                    {isTranslucent && (
                      <div>
                        <label className="text-xs text-gray-500 mb-2 block">유리 프리셋</label>

                        {/* Category filter tabs */}
                        <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
                          <button
                            type="button"
                            onClick={() => setGlassCategory('all')}
                            className={`px-2.5 py-1 text-[10px] border transition-all whitespace-nowrap ${
                              glassCategory === 'all'
                                ? 'border-red-600 text-red-600 bg-red-50'
                                : 'border-gray-200 text-gray-500 hover:border-gray-400'
                            }`}
                          >
                            전체 ({ENHANCED_GLASS_PRESETS.length})
                          </button>
                          {(Object.entries(GLASS_CATEGORY_LABELS) as [GlassCategory, string][]).map(([key, label]) => {
                            const count = ENHANCED_GLASS_PRESETS.filter(p => p.category === key).length
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setGlassCategory(key)}
                                className={`px-2.5 py-1 text-[10px] border transition-all whitespace-nowrap ${
                                  glassCategory === key
                                    ? 'border-red-600 text-red-600 bg-red-50'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-400'
                                }`}
                              >
                                {label} ({count})
                              </button>
                            )
                          })}
                        </div>

                        {/* Preset cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {filteredPresets.map((preset) => {
                            const presetRisk = getGlareRisk(preset.vlr)
                            const isActive = activePreset?.label === preset.label
                            return (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => applyGlassPreset(mat.name, preset)}
                                disabled={disabled}
                                className={`border px-2 py-2 text-left transition-all disabled:opacity-50
                                  hover:border-red-600/30 ${
                                    isActive
                                      ? 'border-red-600 bg-red-50/50'
                                      : 'border-gray-200'
                                  }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="w-3 h-3 border border-gray-300 flex-shrink-0"
                                    style={{
                                      backgroundColor: colorToHex(preset.r, preset.g, preset.b),
                                      opacity: 0.7,
                                    }}
                                  />
                                  <span className="text-[11px] text-gray-700 font-medium truncate">
                                    {preset.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-sky-600 font-medium">
                                    T{(preset.vlt * 100).toFixed(0)}
                                  </span>
                                  <span className={`text-[10px] font-medium ${presetRisk.color}`}>
                                    R{(preset.vlr * 100).toFixed(0)}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    SHGC {preset.shgc}
                                  </span>
                                </div>
                                {preset.note && (
                                  <p className="text-[9px] text-orange-500 mt-0.5 truncate">
                                    {preset.note}
                                  </p>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* ===== 8. Reference table ===== */}
                    {isTranslucent && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowReference(!showReference)}
                          className="text-[11px] text-gray-500 hover:text-gray-700 underline underline-offset-2"
                        >
                          {showReference
                            ? '유리 광학 특성 레퍼런스 접기'
                            : '유리 광학 특성 레퍼런스 보기'}
                        </button>

                        {showReference && (
                          <div className="mt-2 border border-gray-200 bg-white overflow-x-auto">
                            <table className="w-full text-[10px]">
                              <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                  <th className="text-left p-1.5 font-medium text-gray-600">유리 종류</th>
                                  <th className="text-center p-1.5 font-medium text-sky-600">VLT (%)</th>
                                  <th className="text-center p-1.5 font-medium text-red-600">VLR (%)</th>
                                  <th className="text-center p-1.5 font-medium text-gray-600">SHGC</th>
                                  <th className="text-center p-1.5 font-medium text-gray-600">현휘</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ENHANCED_GLASS_PRESETS.map((p) => {
                                  const risk = getGlareRisk(p.vlr)
                                  return (
                                    <tr
                                      key={p.label}
                                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                                      onClick={() => applyGlassPreset(mat.name, p)}
                                    >
                                      <td className="p-1.5 text-gray-700">
                                        <span className="text-[9px] text-gray-400 mr-1">
                                          [{GLASS_CATEGORY_LABELS[p.category]}]
                                        </span>
                                        {p.label}
                                      </td>
                                      <td className="text-center p-1.5 text-gray-600 font-mono">
                                        {(p.vlt * 100).toFixed(0)}
                                      </td>
                                      <td className={`text-center p-1.5 font-mono font-medium ${risk.color}`}>
                                        {(p.vlr * 100).toFixed(0)}
                                      </td>
                                      <td className="text-center p-1.5 text-gray-600 font-mono">
                                        {p.shgc.toFixed(2)}
                                      </td>
                                      <td className={`text-center p-1.5 ${risk.color}`}>
                                        {risk.level}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                            <div className="p-2 border-t border-gray-100 space-y-1">
                              <p className="text-[9px] text-gray-400">
                                * 참고값 기준. 실제 시공 시 제조사 스펙시트 확인 필요.
                              </p>
                              <p className="text-[9px] text-gray-400">
                                VLT = 가시광선 투과율 | VLR = 가시광선 반사율 | SHGC = 태양열취득계수
                              </p>
                              <p className="text-[9px] text-gray-400">
                                레퍼런스 행 클릭 시 해당 프리셋이 적용됩니다.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Auto type indicator */}
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-[10px] text-gray-400">
                        Radiance 타입: <span className="font-mono text-gray-600">{autoType(mat)}</span>
                        {' '} (속성에 따라 자동 결정)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
