'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MaterialOverride, RadianceMaterialType } from '@/lib/types/pipeline'
import { MATERIAL_TYPE_LABELS } from '@/lib/types/pipeline'

interface MaterialEditorProps {
  apiUrl: string
  sessionId: string
  overrides: Record<string, MaterialOverride>
  onChange: (overrides: Record<string, MaterialOverride>) => void
  disabled?: boolean
}

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

const MAT_TYPES: RadianceMaterialType[] = ['plastic', 'trans', 'metal', 'glass']

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

  // Fetch materials from backend
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
    onChange({ ...overrides, [name]: updated })
  }, [overrides, onChange])

  const handleColorChange = useCallback((name: string, hex: string) => {
    const { r, g, b } = hexToRgb(hex)
    handleUpdate(name, { r, g, b })
  }, [handleUpdate])

  const handleTypeChange = useCallback((name: string, mat_type: RadianceMaterialType) => {
    const defaults: Partial<MaterialOverride> = { mat_type }
    // Reset type-specific defaults
    if (mat_type === 'glass') {
      defaults.specularity = 0
      defaults.roughness = 0
      defaults.transmissivity = 0
      defaults.trans_specular = 0
    } else if (mat_type === 'trans') {
      defaults.transmissivity = overrides[name]?.transmissivity || 0.3
      defaults.trans_specular = 0.05
    }
    handleUpdate(name, defaults)
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
      {/* Header with toggle */}
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
          MTL에서 {matList.length}개 재질 감지됨. 펼쳐서 투과율, 반사율, 색상 등을 수정할 수 있습니다.
        </p>
      )}

      {expanded && (
        <div className="mt-4 space-y-2">
          {/* Material list */}
          {matList.map((mat, idx) => {
            const isEditing = editingIdx === idx
            const hex = colorToHex(mat.r, mat.g, mat.b)

            return (
              <div key={mat.name} className="border border-gray-100">
                {/* Material row header */}
                <button
                  type="button"
                  onClick={() => setEditingIdx(isEditing ? null : idx)}
                  disabled={disabled}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                >
                  {/* Color chip */}
                  <div
                    className="w-6 h-6 border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: hex }}
                  />
                  {/* Name */}
                  <span className="text-sm font-mono text-gray-700 flex-1 truncate">{mat.name}</span>
                  {/* Type badge */}
                  <span className="text-xs text-gray-500 border border-gray-200 px-2 py-0.5">
                    {MATERIAL_TYPE_LABELS[mat.mat_type]}
                  </span>
                  {/* Expand arrow */}
                  <span className="text-gray-400 text-xs">{isEditing ? '▲' : '▼'}</span>
                </button>

                {/* Expanded editor */}
                {isEditing && (
                  <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/50">
                    {/* Type selector */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">재질 타입</label>
                      <div className="flex gap-2">
                        {MAT_TYPES.map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => handleTypeChange(mat.name, t)}
                            disabled={disabled}
                            className={`px-3 py-1.5 text-xs border transition-all ${
                              mat.mat_type === t
                                ? 'border-red-600 text-red-600 bg-red-50'
                                : 'border-gray-200 text-gray-600 hover:border-gray-400'
                            } disabled:opacity-50`}
                          >
                            {MATERIAL_TYPE_LABELS[t]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color picker */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">
                        색상 (RGB: {mat.r.toFixed(3)}, {mat.g.toFixed(3)}, {mat.b.toFixed(3)})
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

                    {/* Specularity + Roughness (not for glass) */}
                    {mat.mat_type !== 'glass' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 mb-1.5 block">
                            반사율 (Specularity): {mat.specularity.toFixed(3)}
                          </label>
                          <input
                            type="range"
                            min={0} max={1} step={0.01}
                            value={mat.specularity}
                            onChange={(e) => handleUpdate(mat.name, { specularity: Number(e.target.value) })}
                            disabled={disabled}
                            className="w-full accent-red-600"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1.5 block">
                            거칠기 (Roughness): {mat.roughness.toFixed(3)}
                          </label>
                          <input
                            type="range"
                            min={0} max={1} step={0.01}
                            value={mat.roughness}
                            onChange={(e) => handleUpdate(mat.name, { roughness: Number(e.target.value) })}
                            disabled={disabled}
                            className="w-full accent-red-600"
                          />
                        </div>
                      </div>
                    )}

                    {/* Transmissivity (trans only) */}
                    {mat.mat_type === 'trans' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500 mb-1.5 block">
                            투과율 (Transmissivity): {mat.transmissivity.toFixed(3)}
                          </label>
                          <input
                            type="range"
                            min={0} max={1} step={0.01}
                            value={mat.transmissivity}
                            onChange={(e) => handleUpdate(mat.name, { transmissivity: Number(e.target.value) })}
                            disabled={disabled}
                            className="w-full accent-red-600"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1.5 block">
                            투과 반사율 (Trans Spec): {mat.trans_specular.toFixed(3)}
                          </label>
                          <input
                            type="range"
                            min={0} max={1} step={0.01}
                            value={mat.trans_specular}
                            onChange={(e) => handleUpdate(mat.name, { trans_specular: Number(e.target.value) })}
                            disabled={disabled}
                            className="w-full accent-red-600"
                          />
                        </div>
                      </div>
                    )}
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
