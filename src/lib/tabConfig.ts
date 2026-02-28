import type { LocalizedText } from '@/lib/types/i18n'

export type Category = 'analysis' | 'convert' | 'generate' | 'simulate' | 'compliance'

export interface SubTabConfig {
  id: string
  label: LocalizedText
  status?: 'coming'
}

export const CATEGORY_LABELS: Record<Category, LocalizedText> = {
  analysis: { ko: '분석', en: 'Analysis' },
  convert: { ko: '변환', en: 'Convert' },
  generate: { ko: '생성', en: 'Generate' },
  simulate: { ko: '시뮬레이션', en: 'Simulation' },
  compliance: { ko: '법규', en: 'Compliance' },
}

export const SUB_TABS: Record<Category, SubTabConfig[]> = {
  analysis: [
    { id: 'pipeline', label: { ko: 'SketchUp 파이프라인', en: 'SketchUp Pipeline' } },
    { id: 'daylight', label: { ko: '일조 확인', en: 'Daylight Check' } },
  ],
  convert: [
    { id: 'format', label: { ko: '형식 변환', en: 'Format Convert' } },
    { id: 'tone', label: { ko: '톤 매핑', en: 'Tone Mapping' } },
    { id: 'adjust', label: { ko: '이미지 처리', en: 'Image Processing' } },
  ],
  generate: [
    { id: 'sky', label: { ko: '하늘 만들기', en: 'Sky Generator' } },
    { id: 'model', label: { ko: '3D 모델', en: '3D Model' } },
    { id: 'material', label: { ko: '재질 라이브러리', en: 'Material Library' } },
  ],
  simulate: [
    { id: 'render', label: { ko: '3D 렌더링', en: '3D Rendering' } },
    { id: 'annual', label: { ko: '연간 일조', en: 'Annual Daylight' }, status: 'coming' },
    { id: 'animation', label: { ko: '애니메이션', en: 'Animation' } },
  ],
  compliance: [
    { id: 'disability', label: { ko: '불능현휘', en: 'Disability Glare' } },
    { id: 'sunlight', label: { ko: '일조권', en: 'Sunlight Rights' }, status: 'coming' },
    { id: 'certification', label: { ko: '인증', en: 'Certification' } },
  ],
}
