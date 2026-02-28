'use client'

import type { GlareRisk } from '@/lib/materialPresets'

interface OpticalPropertiesPanelProps {
  vlt: number
  vlr: number
  shgc: number | undefined
  glareRisk: GlareRisk
  activePresetLabel: string | null
}

export default function OpticalPropertiesPanel({
  vlt,
  vlr,
  shgc,
  glareRisk,
  activePresetLabel,
}: OpticalPropertiesPanelProps) {
  const vla = Math.max(0, 1 - vlt - vlr)

  return (
    <div className="border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-700">
          광학 특성 (T + R + A = 1)
        </label>
        {activePresetLabel ? (
          <span className="text-[10px] text-gray-400">
            프리셋: {activePresetLabel}
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
  )
}
