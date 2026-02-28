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

// --- Glass presets ---
interface GlassPreset {
  label: string
  desc: string
  r: number; g: number; b: number
  transmissivity: number
  specularity: number
}

const GLASS_PRESETS: GlassPreset[] = [
  { label: '클리어 6mm',     desc: 'T=0.88',  r: 0.96, g: 0.96, b: 0.96, transmissivity: 0.88, specularity: 0.08 },
  { label: 'Low-E 더블',     desc: 'T=0.65',  r: 0.80, g: 0.80, b: 0.80, transmissivity: 0.65, specularity: 0.12 },
  { label: 'Low-E 트리플',   desc: 'T=0.50',  r: 0.71, g: 0.71, b: 0.71, transmissivity: 0.50, specularity: 0.15 },
  { label: '브론즈 유리',     desc: 'T=0.55',  r: 0.75, g: 0.60, b: 0.45, transmissivity: 0.55, specularity: 0.06 },
  { label: '그레이 유리',     desc: 'T=0.50',  r: 0.65, g: 0.65, b: 0.65, transmissivity: 0.50, specularity: 0.06 },
  { label: '그린 유리',       desc: 'T=0.75',  r: 0.55, g: 0.85, b: 0.60, transmissivity: 0.75, specularity: 0.06 },
  { label: '블루 유리',       desc: 'T=0.60',  r: 0.50, g: 0.60, b: 0.85, transmissivity: 0.60, specularity: 0.06 },
]

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
    // Auto-determine mat_type
    updated.mat_type = autoType(updated)
    onChange({ ...overrides, [name]: updated })
  }, [overrides, onChange])

  const handleColorChange = useCallback((name: string, hex: string) => {
    const { r, g, b } = hexToRgb(hex)
    handleUpdate(name, { r, g, b })
  }, [handleUpdate])

  const applyGlassPreset = useCallback((name: string, preset: GlassPreset) => {
    handleUpdate(name, {
      r: preset.r,
      g: preset.g,
      b: preset.b,
      transmissivity: preset.transmissivity,
      specularity: preset.specularity,
      roughness: 0,
      trans_specular: 1.0, // clear glass = specular transmission
    })
  }, [handleUpdate])

  const toggleMetal = useCallback((name: string) => {
    const current = overrides[name]
    if (!current) return
    const isMetal = current.mat_type === 'metal'
    handleUpdate(name, { mat_type: isMetal ? 'plastic' : 'metal' })
  }, [overrides, handleUpdate])

  const matList = Object.values(overrides)

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
                          반사율: {mat.specularity.toFixed(2)}
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

                    {/* 5. Trans specular (투과 선명도) — only when translucent */}
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

                    {/* 6. Glass presets — only when translucent */}
                    {isTranslucent && (
                      <div>
                        <label className="text-xs text-gray-500 mb-2 block">유리 프리셋</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {GLASS_PRESETS.map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => applyGlassPreset(mat.name, preset)}
                              disabled={disabled}
                              className="border border-gray-200 hover:border-red-600/30 px-2 py-1.5
                                text-left transition-all disabled:opacity-50"
                            >
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="w-3 h-3 border border-gray-300 flex-shrink-0"
                                  style={{
                                    backgroundColor: colorToHex(preset.r, preset.g, preset.b),
                                    opacity: 0.7,
                                  }}
                                />
                                <span className="text-[11px] text-gray-700">{preset.label}</span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-0.5">{preset.desc}</p>
                            </button>
                          ))}
                        </div>
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
