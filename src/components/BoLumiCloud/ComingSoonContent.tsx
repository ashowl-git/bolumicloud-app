'use client'

import { motion } from 'framer-motion'
import {
  Sun, Search, ArrowRightLeft, Palette, SunDim,
  CloudSun, Box, GlassWater, Clapperboard, CalendarRange,
  Film, AlertTriangle, Building2, Award, Lightbulb,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Category = 'analysis' | 'convert' | 'generate' | 'simulate' | 'compliance'

interface ComingSoonContentProps {
  category: Category
  subTab: string
}

export default function ComingSoonContent({ category, subTab }: ComingSoonContentProps) {
  const contentMap: Record<string, {
    icon: LucideIcon
    title: string
    description: string
    features: string[]
    pyradianceFunctions: string[]
    example: string
    timeline: string
  }> = {
    // 분석 카테고리
    'analysis-daylight': {
      icon: Sun,
      title: '일조 확인',
      description: '건물 위치와 주변 환경을 입력하면 일조권 법규를 자동으로 확인합니다',
      features: [
        '지도에서 위치 클릭 또는 주소 검색',
        '주변 건물 높이 자동 추출 (지도 API)',
        '동지/춘추분 일조 시간 계산',
        '건축법 일조권 기준 자동 판정 (연속 2시간, 총 4시간)',
        'Daylight Factor 히트맵',
        'LEED Daylight Credit 자동 판정'
      ],
      pyradianceFunctions: ['gendaymtx', 'dctimestep', 'gendaylit', 'rtrace'],
      example: '예시: 여의도 아파트 -> 북측 15층 건물 고려 -> 일조권 적합 판정',
      timeline: 'Phase 2 (1주 후)'
    },

    'analysis-material': {
      icon: Search,
      title: '재질 확인',
      description: '유리, 블라인드 등 재질의 빛 투과/반사 특성을 시뮬레이션합니다',
      features: [
        'BSDF (양방향 산란 분포 함수) 분석',
        '유리 투과율 계산 (두께, 굴절률, Low-E 코팅)',
        '블라인드 각도별 차광 성능',
        'IES 조명 파일 업로드 및 분석',
        '재질 비교 (Clear vs Low-E vs Smart Glass)'
      ],
      pyradianceFunctions: ['generate_bsdf', 'GenGlaze', 'generate_blinds', 'ies2rad'],
      example: '예시: Low-E 유리 vs 일반 유리 -> 투과율 60% vs 88% 비교',
      timeline: 'Phase 3 (2주 후)'
    },

    // 변환 카테고리
    'convert-format': {
      icon: ArrowRightLeft,
      title: '형식 변환',
      description: 'HDR 이미지를 다양한 형식으로 변환합니다 (TIFF, PNG, PPM, BMP)',
      features: [
        '.pic/.hdr -> .tiff (고품질)',
        '.pic/.hdr -> .png (웹 호환)',
        '.pic/.hdr -> .ppm (Portable Pixmap)',
        '.tiff -> .pic (역변환)',
        '배치 변환 (한 번에 여러 파일)'
      ],
      pyradianceFunctions: ['ra_tiff', 'ra_ppm', 'ra_bmp'],
      example: '예시: D08_c1.pic -> D08_c1.png (브라우저에서 바로 확인 가능)',
      timeline: 'Phase 2 (1주 후)'
    },

    'convert-tone': {
      icon: Palette,
      title: '톤 매핑',
      description: 'HDR 이미지를 일반 모니터에서 볼 수 있도록 톤 매핑합니다',
      features: [
        '인간 시각 시뮬레이션 (베일링, 시력 감소)',
        '자동 노출 조정',
        '로컬/글로벌 톤 매핑',
        'Before/After 비교',
        '커스텀 감마 곡선'
      ],
      pyradianceFunctions: ['pcond'],
      example: '예시: 과다 노출 HDR -> 자연스러운 LDR 이미지',
      timeline: 'Phase 2 (1주 후)'
    },

    'convert-adjust': {
      icon: SunDim,
      title: '노출 조정',
      description: 'HDR 이미지의 밝기, 대비, 해상도를 조정합니다',
      features: [
        '노출 배수 조정 (0.1x ~ 5.0x)',
        '가우시안 블러',
        '핫 픽셀 제거',
        '해상도 변경 (축소/확대)',
        '여러 이미지 합성'
      ],
      pyradianceFunctions: ['pfilt', 'Pcomb', 'pcompos'],
      example: '예시: 어두운 이미지 2배 밝게 -> 디테일 확인',
      timeline: 'Phase 2 (1주 후)'
    },

    // 생성 카테고리
    'generate-sky': {
      icon: CloudSun,
      title: '하늘 만들기',
      description: '특정 날짜/시간/위치의 하늘 모델을 생성합니다',
      features: [
        '달력에서 날짜 선택 (동지, 춘추분, 하지)',
        '시간 슬라이더 (08:00 ~ 17:00)',
        '지도에서 위치 클릭',
        'Perez All-Weather 모델 (실제 하늘)',
        'CIE 표준 하늘 (맑음/흐림)',
        '연간 매트릭스 생성 (365일 x 24시간)',
        '하늘 HDR 미리보기'
      ],
      pyradianceFunctions: ['gendaylit', 'gensky', 'gendaymtx', 'gensdaymtx'],
      example: '예시: 2025-12-21 14:00 서울 -> 동지 오후 2시 하늘 생성',
      timeline: 'Phase 3 (2주 후)'
    },

    'generate-model': {
      icon: Box,
      title: '3D 모델 만들기',
      description: '간단한 3D 형상을 파라메트릭으로 생성합니다',
      features: [
        '박스 (genbox): 방, 건물 단순 모델',
        '회전체 (genrev): 조명 갓, 기둥',
        '블라인드 (genblinds): 슬랫 각도 설정',
        '유리 (genglaze): 투과율, 두께 설정',
        '재질 자동 할당'
      ],
      pyradianceFunctions: ['genbox', 'genrev', 'genblinds', 'genglaze'],
      example: '예시: 5m x 4m x 3m 방 모델 -> .rad 파일 다운로드',
      timeline: 'Phase 4 (1개월 후)'
    },

    'generate-material': {
      icon: GlassWater,
      title: '재질 만들기',
      description: '유리, 블라인드 등의 BSDF 재질 파일을 생성합니다',
      features: [
        '유리 BSDF: 투과율, 반사율, 굴절률 설정',
        '블라인드 BSDF: 슬랫 각도, 폭, 간격 설정',
        'Low-E 코팅 시뮬레이션',
        'XML 파일 생성 (Radiance 호환)',
        '재질 라이브러리 저장'
      ],
      pyradianceFunctions: ['GenGlaze', 'generate_bsdf', 'generate_blinds'],
      example: '예시: Low-E 유리 (투과율 60%, 반사율 15%) -> BSDF XML',
      timeline: 'Phase 4 (1개월 후)'
    },

    // 시뮬레이션 카테고리
    'simulate-render': {
      icon: Clapperboard,
      title: '3D 렌더링',
      description: '.obj 파일을 업로드하면 자동으로 포토리얼리스틱 렌더링을 수행합니다',
      features: [
        '.obj 파일 업로드 (SketchUp, Rhino, Revit export)',
        '재질 자동 할당 또는 수동 편집',
        '자동 뷰포인트 생성 (6방향)',
        '커스텀 카메라 설정 (Three.js 뷰어)',
        '하늘/조명 설정',
        'rpict 고품질 렌더링 (10-30분)',
        'HDR 갤러리 + 자동 현휘 분석'
      ],
      pyradianceFunctions: ['rpict', 'rtrace', 'oconv', 'obj2rad', 'mkpmap'],
      example: '예시: room.obj 업로드 -> 6개 뷰 렌더링 -> DGP 자동 계산',
      timeline: 'Phase 5 (1.5개월 후)'
    },

    'simulate-annual': {
      icon: CalendarRange,
      title: '연간 일조 시뮬레이션',
      description: '1년 365일 x 24시간 일조 데이터를 계산합니다',
      features: [
        'EPW 기상 파일 자동 다운로드',
        '연간 하늘 매트릭스 생성 (gendaymtx)',
        '시간대별 조도 계산 (dctimestep)',
        'Daylight Autonomy (DA300, DA500)',
        'Useful Daylight Illuminance (UDI)',
        'Annual Sunlight Exposure (ASE)',
        '월별/계절별 통계 그래프'
      ],
      pyradianceFunctions: ['gendaymtx', 'dctimestep', 'rfluxmtx', 'rmtxop'],
      example: '예시: 서울 오피스 -> 연간 DA300 85% (LEED 기준 충족)',
      timeline: 'Phase 3 (2주 후)'
    },

    'simulate-animation': {
      icon: Film,
      title: '애니메이션',
      description: '시간대별 변화를 GIF/MP4 애니메이션으로 생성합니다',
      features: [
        '시간대별 HDR -> GIF (08:00 ~ 17:00)',
        'Falsecolor 애니메이션 (휘도 변화 시각화)',
        '월별 비교 애니메이션',
        'FPS 조정 (1-10 fps)',
        '무한 반복 옵션',
        '프레젠테이션용 고품질 MP4'
      ],
      pyradianceFunctions: ['pcond', 'falsecolor', 'pcompos'],
      example: '예시: 08시~17시 변화 -> 10초 GIF (클라이언트 설명용)',
      timeline: 'Phase 2 (1주 후)'
    },

    // 법규 카테고리
    'compliance-disability': {
      icon: AlertTriangle,
      title: '불능현휘 판정',
      description: '5가지 조건을 자동으로 체크하여 불능현휘 여부를 판정합니다',
      features: [
        '휘도 대비 >= 10 체크',
        '최대 휘도 > 25,000 체크',
        '평균 휘도 > 10,000 체크',
        'DGP > 0.45 체크',
        'DGI > 31 체크',
        '위반 조건 상세 표시',
        '개선 권고사항 자동 생성'
      ],
      pyradianceFunctions: ['evalglare', 'pvalue'],
      example: '예시: 동측 창 -> 조건 2, 4 위반 -> 외부 차양 권장',
      timeline: 'Phase 2 (1주 후) - 현재 분석에 포함, 별도 탭으로 분리'
    },

    'compliance-sunlight': {
      icon: Building2,
      title: '일조권 법규',
      description: '건축법 일조권 기준을 자동으로 확인합니다',
      features: [
        '동지 기준: 연속 2시간 이상',
        '춘추분 기준: 총 4시간 이상 (주거)',
        '인동 간격 계산',
        '일조 시뮬레이션 + 법규 판정',
        '부적합 시 건물 높이/위치 제안',
        'PDF 리포트 (인허가 제출용)'
      ],
      pyradianceFunctions: ['gendaymtx', 'dctimestep', 'rtrace'],
      example: '예시: 25층 아파트 -> 북측 일조권 부적합 -> 3층 낮추기 권장',
      timeline: 'Phase 3 (2주 후)'
    },

    'compliance-certification': {
      icon: Award,
      title: '녹색건축/LEED 인증',
      description: '녹색건축 인증, LEED, WELL 기준을 자동으로 확인합니다',
      features: [
        '녹색건축 인증: 불능현휘 (+3점)',
        'LEED v4.1: Daylight Credit (Option 1, 2)',
        'WELL Building: L07 Glare Control',
        'EN 12464: Workplace Lighting',
        '종합 체크리스트',
        '점수 계산 및 개선 제안'
      ],
      pyradianceFunctions: ['evalglare', 'dctimestep', 'gendaymtx'],
      example: '예시: 오피스 빌딩 -> LEED 2점, 녹색건축 3점 획득 가능',
      timeline: 'Phase 4 (1개월 후)'
    }
  }

  const key = `${category}-${subTab}`
  const content = contentMap[key]

  if (!content) {
    return (
      <div className="py-24 text-center">
        <p className="text-gray-800">준비 중입니다.</p>
      </div>
    )
  }

  const Icon = content.icon

  return (
    <div className="py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* 아이콘 + 제목 */}
        <div className="text-center mb-12">
          <div className="mb-4 flex justify-center">
            <Icon size={48} strokeWidth={1} className="text-gray-400" />
          </div>
          <h2 className="text-3xl font-light text-gray-900 mb-3">
            {content.title}
          </h2>
          <div className="w-24 h-px bg-gray-300 mx-auto mb-4" />
          <p className="text-base text-gray-800 max-w-2xl mx-auto">
            {content.description}
          </p>
        </div>

        {/* 주요 기능 */}
        <div className="border border-gray-200 p-8 mb-8">
          <h3 className="text-lg font-normal text-gray-900 mb-4">
            주요 기능
          </h3>
          <ul className="space-y-2">
            {content.features.map((feature, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="text-red-600 flex-shrink-0">--</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 사용 예시 */}
        <div className="border border-gray-200 bg-gray-50 p-6 mb-8">
          <p className="text-sm text-gray-700">
            <span className="flex items-center gap-2">
              <Lightbulb size={14} strokeWidth={1.5} className="text-gray-500 flex-shrink-0" />
              <span className="font-medium">{content.example}</span>
            </span>
          </p>
        </div>

        {/* 기술 정보 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="border border-gray-200 p-6">
            <h4 className="font-medium text-gray-900 mb-3">pyradiance 함수</h4>
            <div className="space-y-1">
              {content.pyradianceFunctions.map((func, i) => (
                <code key={i} className="block text-xs text-gray-800 font-mono">
                  {func}()
                </code>
              ))}
            </div>
          </div>

          <div className="border border-gray-200 p-6">
            <h4 className="font-medium text-gray-900 mb-3">예상 완성</h4>
            <p className="text-2xl font-light text-red-600">
              {content.timeline}
            </p>
            <p className="text-xs text-gray-800 mt-2">
              pyradiance 마스터플랜 기준
            </p>
          </div>
        </div>

        {/* 액션 */}
        <div className="text-center space-y-4">
          <a
            href="/nuggets/bolumicloud?category=analysis&tab=glare"
            className="border border-gray-200 hover:border-red-600/30 px-6 py-3
              text-gray-900 hover:text-red-600 transition-all duration-300 inline-block"
          >
            {'<-'} 현재 사용 가능한 기능 (현휘 확인)으로 돌아가기
          </a>

          <p className="text-xs text-gray-800">
            또는 상단 카테고리 탭에서 다른 기능을 둘러보세요
          </p>
        </div>
      </motion.div>
    </div>
  )
}
