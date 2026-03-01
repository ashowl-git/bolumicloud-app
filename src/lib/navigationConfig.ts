import {
  ScanEye, Sun, Eye, EyeOff, Telescope,
  Wrench, ArrowRightLeft, Palette, SunDim, CloudSun,
  Box, GlassWater, Clapperboard, Film,
  ShieldCheck, AlertTriangle, Award, Building2, Star,
} from 'lucide-react'
import type { NavigationConfig } from './types/navigation'

export const NAVIGATION: NavigationConfig = [
  {
    id: 'analysis',
    name: { ko: '분석', en: 'Analysis' },
    icon: ScanEye,
    basePath: '/analysis',
    modules: [
      {
        id: 'glare',
        slug: 'glare',
        name: { ko: '현휘 분석', en: 'Glare Analysis' },
        description: { ko: 'SketchUp 파이프라인 기반 현휘(DGP/DGI) 분석', en: 'SketchUp pipeline-based glare (DGP/DGI) analysis' },
        icon: ScanEye,
        status: 'active',
      },
      {
        id: 'daylighting',
        slug: 'daylighting',
        name: { ko: '주광 분석', en: 'Daylighting' },
        description: { ko: '일조 확인 및 Daylight Factor 분석', en: 'Daylight availability and DF analysis' },
        icon: Sun,
        status: 'active',
      },
      {
        id: 'sunlight',
        slug: 'sunlight',
        name: { ko: '일조 분석', en: 'Sunlight Analysis' },
        description: { ko: 'Sanalyst 기반 일조 시뮬레이션', en: 'Sanalyst-based sunlight simulation' },
        icon: Telescope,
        status: 'active',
      },
      {
        id: 'view',
        slug: 'view',
        name: { ko: '조망 분석', en: 'View Analysis' },
        description: { ko: 'Sanalyst 기반 조망권 분석', en: 'Sanalyst-based view analysis' },
        icon: Eye,
        status: 'coming-soon',
      },
      {
        id: 'privacy',
        slug: 'privacy',
        name: { ko: '사생활 분석', en: 'Privacy Analysis' },
        description: { ko: 'Sanalyst 기반 사생활 침해 분석', en: 'Sanalyst-based privacy analysis' },
        icon: EyeOff,
        status: 'coming-soon',
      },
    ],
  },
  {
    id: 'tools',
    name: { ko: '도구', en: 'Tools' },
    icon: Wrench,
    basePath: '/tools',
    modules: [
      {
        id: 'convert',
        slug: 'convert',
        name: { ko: '형식 변환', en: 'File Conversion' },
        description: { ko: 'HDR/LDR 이미지 형식 변환', en: 'HDR/LDR image format conversion' },
        icon: ArrowRightLeft,
        status: 'active',
      },
      {
        id: 'tone-mapping',
        slug: 'tone-mapping',
        name: { ko: '톤 매핑', en: 'Tone Mapping' },
        description: { ko: '인간 시각 감도 기반 톤 매핑', en: 'Human visual sensitivity tone mapping' },
        icon: Palette,
        status: 'active',
      },
      {
        id: 'image',
        slug: 'image',
        name: { ko: '이미지 처리', en: 'Image Processing' },
        description: { ko: '노출, 대비, 채도 조정', en: 'Exposure, contrast, saturation adjustment' },
        icon: SunDim,
        status: 'active',
      },
      {
        id: 'sky',
        slug: 'sky',
        name: { ko: '하늘 생성', en: 'Sky Generator' },
        description: { ko: 'Radiance 하늘 모델(.rad) 생성', en: 'Radiance sky model (.rad) generation' },
        icon: CloudSun,
        status: 'active',
      },
      {
        id: 'model',
        slug: 'model',
        name: { ko: '3D 모델', en: '3D Model' },
        description: { ko: '파라메트릭 박스 모델 생성', en: 'Parametric box model generation' },
        icon: Box,
        status: 'active',
      },
      {
        id: 'material',
        slug: 'material',
        name: { ko: '재질 라이브러리', en: 'Material Library' },
        description: { ko: '유리, 플라스틱, 메탈 프리셋', en: 'Glass, plastic, metal presets' },
        icon: GlassWater,
        status: 'active',
      },
      {
        id: 'render',
        slug: 'render',
        name: { ko: '3D 렌더링', en: '3D Rendering' },
        description: { ko: 'rpict 기반 포토리얼리스틱 렌더링', en: 'rpict-based photorealistic rendering' },
        icon: Clapperboard,
        status: 'active',
      },
      {
        id: 'animation',
        slug: 'animation',
        name: { ko: '애니메이션', en: 'Animation' },
        description: { ko: '시간대별 조명 변화 애니메이션', en: 'Time-based lighting animation' },
        icon: Film,
        status: 'active',
      },
    ],
  },
  {
    id: 'compliance',
    name: { ko: '법규', en: 'Compliance' },
    icon: ShieldCheck,
    basePath: '/compliance',
    modules: [
      {
        id: 'glare-compliance',
        slug: 'glare',
        name: { ko: '불능현휘', en: 'Disability Glare' },
        description: { ko: 'DGI/대비 기반 불능현휘 판정', en: 'DGI/contrast-based disability glare assessment' },
        icon: AlertTriangle,
        status: 'active',
      },
      {
        id: 'certification',
        slug: 'certification',
        name: { ko: '인증 체크리스트', en: 'Certification Checklist' },
        description: { ko: '녹색건축/LEED 인증 확인', en: 'Green building/LEED certification check' },
        icon: Award,
        status: 'active',
      },
      {
        id: 'sunlight-rights',
        slug: 'sunlight-rights',
        name: { ko: '일조권', en: 'Sunlight Rights' },
        description: { ko: 'Sanalyst 기반 일조권 법규 검토', en: 'Sanalyst-based sunlight rights review' },
        icon: Building2,
        status: 'coming-soon',
      },
      {
        id: 'performance',
        slug: 'performance',
        name: { ko: '주택성능등급', en: 'Housing Performance' },
        description: { ko: 'Sanalyst 기반 주택성능등급 평가', en: 'Sanalyst-based housing performance rating' },
        icon: Star,
        status: 'coming-soon',
      },
    ],
  },
]

export function getModuleByPath(pathname: string) {
  for (const section of NAVIGATION) {
    for (const mod of section.modules) {
      if (pathname === `${section.basePath}/${mod.slug}`) {
        return { section, module: mod }
      }
    }
  }
  return null
}

export function getBreadcrumbs(pathname: string) {
  const result = getModuleByPath(pathname)
  if (!result) return []
  return [
    { name: { ko: '홈', en: 'Home' }, href: '/' },
    { name: result.section.name, href: result.section.basePath },
    { name: result.module.name },
  ]
}
