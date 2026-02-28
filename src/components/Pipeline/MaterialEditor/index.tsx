'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MaterialOverride } from '@/lib/types/pipeline'
import { logger } from '@/lib/logger'
import { useApiClient } from '@/lib/api'
import {
  autoType,
  hexToRgb,
} from '@/lib/materialPresets'
import type { EnhancedGlassPreset, GlassCategory } from '@/lib/materialPresets'

import MaterialRow from './MaterialRow'

interface MaterialEditorProps {
  apiUrl: string
  sessionId: string
  overrides: Record<string, MaterialOverride>
  onChange: (overrides: Record<string, MaterialOverride>) => void
  disabled?: boolean
}

export default function MaterialEditor({
  sessionId,
  overrides,
  onChange,
  disabled,
}: MaterialEditorProps) {
  const api = useApiClient()
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [glassCategory, setGlassCategory] = useState<GlassCategory | 'all'>('all')
  const [showReference, setShowReference] = useState(false)
  // Track which preset each material is using (for accurate VLR/SHGC display)
  const [presetInfo, setPresetInfo] = useState<Record<string, EnhancedGlassPreset | null>>({})

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)
    api.get(`/pipeline/materials/${sessionId}`)
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
      .catch((err) => {
        logger.error('Material fetch failed', err instanceof Error ? err : undefined)
      })
      .finally(() => setLoading(false))
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

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
          {matList.map((mat, idx) => (
            <MaterialRow
              key={mat.name}
              mat={mat}
              isEditing={editingIdx === idx}
              onToggleEdit={() => setEditingIdx(editingIdx === idx ? null : idx)}
              onUpdate={(partial) => handleUpdate(mat.name, partial)}
              onColorChange={(hex) => handleColorChange(mat.name, hex)}
              onToggleMetal={() => toggleMetal(mat.name)}
              onApplyPreset={(preset) => applyGlassPreset(mat.name, preset)}
              activePreset={presetInfo[mat.name] ?? null}
              glassCategory={glassCategory}
              onCategoryChange={setGlassCategory}
              showReference={showReference}
              onToggleReference={() => setShowReference(!showReference)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  )
}
