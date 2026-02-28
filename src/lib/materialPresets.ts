import type { MaterialOverride, RadianceMaterialType } from '@/lib/types/pipeline'

// --- Glass category & preset types ---
export type GlassCategory = 'single' | 'double' | 'triple' | 'reflective' | 'special'

export const GLASS_CATEGORY_LABELS: Record<GlassCategory, string> = {
  single: '단판',
  double: '복층',
  triple: '삼중',
  reflective: '반사',
  special: '기능성',
}

export interface EnhancedGlassPreset {
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
export const ENHANCED_GLASS_PRESETS: EnhancedGlassPreset[] = [
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
export interface GlareRisk {
  level: string
  color: string
  bgColor: string
  desc: string
}

export function getGlareRisk(vlr: number): GlareRisk {
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
export function estimateVLR(specularity: number): number {
  return Math.max(0.08, specularity)
}

// --- Helpers ---
export function colorToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { r: 0.5, g: 0.5, b: 0.5 }
  return {
    r: Math.round((parseInt(result[1], 16) / 255) * 1000) / 1000,
    g: Math.round((parseInt(result[2], 16) / 255) * 1000) / 1000,
    b: Math.round((parseInt(result[3], 16) / 255) * 1000) / 1000,
  }
}

export function autoType(mat: MaterialOverride): RadianceMaterialType {
  if (mat.transmissivity > 0) {
    return mat.trans_specular >= 0.9 ? 'glass' : 'trans'
  }
  return mat.mat_type === 'metal' ? 'metal' : 'plastic'
}

export function typeLabel(mat: MaterialOverride): string {
  const t = autoType(mat)
  switch (t) {
    case 'plastic': return '불투명'
    case 'metal': return '금속'
    case 'trans': return '반투명 (확산)'
    case 'glass': return '투명 유리'
  }
}
