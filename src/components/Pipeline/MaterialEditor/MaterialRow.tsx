'use client'

import type { MaterialOverride } from '@/lib/types/pipeline'
import type { EnhancedGlassPreset, GlassCategory, GlareRisk } from '@/lib/materialPresets'
import {
  colorToHex,
  autoType,
  typeLabel,
  getGlareRisk,
  estimateVLR,
} from '@/lib/materialPresets'

import OpticalPropertiesPanel from './OpticalPropertiesPanel'
import GlassPresetPicker from './GlassPresetPicker'
import GlassReferenceTable from './GlassReferenceTable'

interface MaterialRowProps {
  mat: MaterialOverride
  isEditing: boolean
  onToggleEdit: () => void
  onUpdate: (partial: Partial<MaterialOverride>) => void
  onColorChange: (hex: string) => void
  onToggleMetal: () => void
  onApplyPreset: (preset: EnhancedGlassPreset) => void
  activePreset: EnhancedGlassPreset | null
  glassCategory: GlassCategory | 'all'
  onCategoryChange: (cat: GlassCategory | 'all') => void
  showReference: boolean
  onToggleReference: () => void
  disabled?: boolean
}

export default function MaterialRow({
  mat,
  isEditing,
  onToggleEdit,
  onUpdate,
  onColorChange,
  onToggleMetal,
  onApplyPreset,
  activePreset,
  glassCategory,
  onCategoryChange,
  showReference,
  onToggleReference,
  disabled,
}: MaterialRowProps) {
  const hex = colorToHex(mat.r, mat.g, mat.b)
  const isTranslucent = mat.transmissivity > 0
  const isMetal = mat.mat_type === 'metal'

  // Optical properties
  const vlr = activePreset ? activePreset.vlr : estimateVLR(mat.specularity)
  // Approximate VLT from Radiance transmissivity (single pane: T_vis ~ t * 0.915)
  const vlt = activePreset ? activePreset.vlt : mat.transmissivity * 0.915
  const shgc = activePreset?.shgc
  const glareRisk: GlareRisk = getGlareRisk(vlr)

  return (
    <div className="border border-gray-100">
      {/* Row header */}
      <button
        type="button"
        onClick={onToggleEdit}
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
                onChange={(e) => onColorChange(e.target.value)}
                disabled={disabled}
                className="w-10 h-8 border border-gray-200 cursor-pointer disabled:opacity-50"
              />
              <input
                type="text"
                value={hex}
                onChange={(e) => onColorChange(e.target.value)}
                disabled={disabled}
                className="w-24 border border-gray-200 px-2 py-1 text-xs font-mono
                  focus:outline-none focus:border-red-600/30 disabled:opacity-50"
              />
            </div>
          </div>

          {/* 2. Metal toggle */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500">금속 재질</label>
            <button
              type="button"
              onClick={onToggleMetal}
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
                onChange={(e) => onUpdate({ specularity: Number(e.target.value) })}
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
                onChange={(e) => onUpdate({ roughness: Number(e.target.value) })}
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
              onChange={(e) => onUpdate({ transmissivity: Number(e.target.value) })}
              disabled={disabled}
              className="w-full accent-red-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>불투명 (벽, 바닥)</span><span>완전 투명 (유리)</span>
            </div>
          </div>

          {/* 5. Optical Properties Panel (T/R/A) */}
          {isTranslucent && (
            <OpticalPropertiesPanel
              vlt={vlt}
              vlr={vlr}
              shgc={shgc}
              glareRisk={glareRisk}
              activePresetLabel={activePreset?.label ?? null}
            />
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
                onChange={(e) => onUpdate({ trans_specular: Number(e.target.value) })}
                disabled={disabled}
                className="w-full accent-red-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>확산 (frosted glass)</span><span>직진 투과 (clear glass)</span>
              </div>
            </div>
          )}

          {/* 7. Enhanced Glass Presets with category tabs */}
          {isTranslucent && (
            <GlassPresetPicker
              glassCategory={glassCategory}
              onCategoryChange={onCategoryChange}
              activePresetLabel={activePreset?.label ?? null}
              onApplyPreset={onApplyPreset}
              disabled={disabled}
            />
          )}

          {/* 8. Reference table */}
          {isTranslucent && (
            <GlassReferenceTable
              showReference={showReference}
              onToggle={onToggleReference}
              onApplyPreset={onApplyPreset}
            />
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
}
