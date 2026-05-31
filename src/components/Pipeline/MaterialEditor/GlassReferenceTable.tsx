'use client'

import {
  GLASS_CATEGORY_LABELS,
  ENHANCED_GLASS_PRESETS,
  getGlareRisk,
} from '@/lib/materialPresets'
import type { EnhancedGlassPreset } from '@/lib/materialPresets'

interface GlassReferenceTableProps {
  showReference: boolean
  onToggle: () => void
  onApplyPreset: (preset: EnhancedGlassPreset) => void
}

export default function GlassReferenceTable({
  showReference,
  onToggle,
  onApplyPreset,
}: GlassReferenceTableProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
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
                    onClick={() => onApplyPreset(p)}
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
  )
}
