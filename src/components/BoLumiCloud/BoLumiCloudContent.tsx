'use client'

import { useState } from 'react'
import { ApiProvider, PipelineProvider, useApi } from '@/contexts'
import { usePipelineContext } from '@/contexts/PipelineContext'
import BoLumiCloudHeader from './BoLumiCloudHeader'
import Navbar from '@/components/Navigation/Navbar'
import Footer from '@/components/Navigation/Footer'
import CategoryTabs from '@/components/BoLumiCloud/CategoryTabs'
import SubTabs from '@/components/BoLumiCloud/SubTabs'
import ComingSoonContent from '@/components/BoLumiCloud/ComingSoonContent'
import FileConversion from '@/components/BoLumiCloud/FileConversion'
import TimelineAnimation from '@/components/BoLumiCloud/TimelineAnimation'
import ImageProcessing from '@/components/BoLumiCloud/ImageProcessing'
import CertificationChecklist from '@/components/BoLumiCloud/CertificationChecklist'
import SkyGenerator from '@/components/BoLumiCloud/SkyGenerator'
import DisabilityGlare from '@/components/BoLumiCloud/DisabilityGlare'
import BoxModelGenerator from '@/components/BoLumiCloud/BoxModelGenerator'
import ToneMapping from '@/components/BoLumiCloud/ToneMapping'
import MaterialLibrary from '@/components/BoLumiCloud/MaterialLibrary'
import DaylightAnalysis from '@/components/BoLumiCloud/DaylightAnalysis'
import RenderScene from '@/components/BoLumiCloud/RenderScene'
import SketchUpPipelineTab from '@/components/BoLumiCloud/tabs/SketchUpPipelineTab'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import type { LocalizedText } from '@/lib/types/i18n'

type Category = 'analysis' | 'convert' | 'generate' | 'simulate' | 'compliance'

const txt = {
  pipeline: { ko: 'SketchUp 파이프라인', en: 'SketchUp Pipeline' } as LocalizedText,
  daylight: { ko: '일조 확인', en: 'Daylight Check' } as LocalizedText,
  format: { ko: '형식 변환', en: 'Format Convert' } as LocalizedText,
  tone: { ko: '톤 매핑', en: 'Tone Mapping' } as LocalizedText,
  adjust: { ko: '이미지 처리', en: 'Image Processing' } as LocalizedText,
  sky: { ko: '하늘 만들기', en: 'Sky Generator' } as LocalizedText,
  model: { ko: '3D 모델', en: '3D Model' } as LocalizedText,
  material: { ko: '재질 라이브러리', en: 'Material Library' } as LocalizedText,
  render: { ko: '3D 렌더링', en: '3D Rendering' } as LocalizedText,
  annual: { ko: '연간 일조', en: 'Annual Daylight' } as LocalizedText,
  animation: { ko: '애니메이션', en: 'Animation' } as LocalizedText,
  disability: { ko: '불능현휘', en: 'Disability Glare' } as LocalizedText,
  sunlight: { ko: '일조권', en: 'Sunlight Rights' } as LocalizedText,
  certification: { ko: '인증', en: 'Certification' } as LocalizedText,
  platformInfo: { ko: '플랫폼 정보', en: 'Platform Info' } as LocalizedText,
  coreEngine: { ko: '핵심 엔진', en: 'Core Engine' } as LocalizedText,
  pyFunctions: { ko: '110개 Python 함수', en: '110 Python functions' } as LocalizedText,
  radBinaries: { ko: '91개 Radiance 바이너리', en: '91 Radiance binaries' } as LocalizedText,
  supportedFeatures: { ko: '지원 기능 (11개)', en: 'Features (11)' } as LocalizedText,
  featGlare: { ko: '- 현휘 분석 (DGP/DGI/UGR)', en: '- Glare analysis (DGP/DGI/UGR)' } as LocalizedText,
  featDaylight: { ko: '- 일조 분석 (일조권, DF)', en: '- Daylight analysis (Sun rights, DF)' } as LocalizedText,
  featSky: { ko: '- 하늘 모델 생성', en: '- Sky model generation' } as LocalizedText,
  featImage: { ko: '- 이미지 처리 (톤 매핑)', en: '- Image processing (tone mapping)' } as LocalizedText,
  featConvert: { ko: '- 파일 변환 (HDR-TIFF/PNG)', en: '- File conversion (HDR-TIFF/PNG)' } as LocalizedText,
  feat3d: { ko: '- 3D 모델링 (OBJ-RAD)', en: '- 3D modeling (OBJ-RAD)' } as LocalizedText,
  featRender: { ko: '- 3D 렌더링 (rpict)', en: '- 3D rendering (rpict)' } as LocalizedText,
  featBsdf: { ko: '- 재질 분석 (BSDF)', en: '- Material analysis (BSDF)' } as LocalizedText,
  featCompliance: { ko: '- 법규 준수 (녹색/LEED)', en: '- Compliance (Green/LEED)' } as LocalizedText,
  fileFormats: { ko: '파일 형식', en: 'File Formats' } as LocalizedText,
  input: { ko: '입력:', en: 'Input:' } as LocalizedText,
  output: { ko: '출력:', en: 'Output:' } as LocalizedText,
  data: { ko: '데이터:', en: 'Data:' } as LocalizedText,
  version: { ko: '버전: 0.3.0 (2026-02-28)', en: 'Version: 0.3.0 (2026-02-28)' } as LocalizedText,
}

function BoLumiCloudInner() {
  const [category, setCategory] = useState<Category>('analysis')
  const [subTab, setSubTab] = useState('pipeline')
  const { t } = useLocalizedText()

  const { backendStatus, backendInfo, apiUrl } = useApi()
  const { results: pipelineResults } = usePipelineContext()

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24">
        {/* Hero Section + Backend Status */}
        <BoLumiCloudHeader
          backendStatus={backendStatus}
          backendInfo={backendInfo}
        />

        {/* Category Tabs (Sticky) */}
        <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <CategoryTabs
              active={category}
              onChange={(cat) => {
                setCategory(cat)
                const subTabsMap: Record<Category, { id: string; label: string; status?: 'coming' }[]> = {
                  analysis: [
                    { id: 'pipeline', label: t(txt.pipeline) },
                    { id: 'daylight', label: t(txt.daylight) }
                  ],
                  convert: [
                    { id: 'format', label: t(txt.format) },
                    { id: 'tone', label: t(txt.tone) },
                    { id: 'adjust', label: t(txt.adjust) }
                  ],
                  generate: [
                    { id: 'sky', label: t(txt.sky) },
                    { id: 'model', label: t(txt.model) },
                    { id: 'material', label: t(txt.material) }
                  ],
                  simulate: [
                    { id: 'render', label: t(txt.render) },
                    { id: 'annual', label: t(txt.annual), status: 'coming' },
                    { id: 'animation', label: t(txt.animation) }
                  ],
                  compliance: [
                    { id: 'disability', label: t(txt.disability) },
                    { id: 'sunlight', label: t(txt.sunlight), status: 'coming' },
                    { id: 'certification', label: t(txt.certification) }
                  ]
                }
                setSubTab(subTabsMap[cat][0].id)
              }}
            />
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <SubTabs
              tabs={
                category === 'analysis' ? [
                  { id: 'pipeline', label: t(txt.pipeline) },
                  { id: 'daylight', label: t(txt.daylight) }
                ] :
                category === 'convert' ? [
                  { id: 'format', label: t(txt.format) },
                  { id: 'tone', label: t(txt.tone) },
                  { id: 'adjust', label: t(txt.adjust) }
                ] :
                category === 'generate' ? [
                  { id: 'sky', label: t(txt.sky) },
                  { id: 'model', label: t(txt.model) },
                  { id: 'material', label: t(txt.material) }
                ] :
                category === 'simulate' ? [
                  { id: 'render', label: t(txt.render) },
                  { id: 'annual', label: t(txt.annual), status: 'coming' },
                  { id: 'animation', label: t(txt.animation) }
                ] :
                [
                  { id: 'disability', label: t(txt.disability) },
                  { id: 'sunlight', label: t(txt.sunlight), status: 'coming' },
                  { id: 'certification', label: t(txt.certification) }
                ]
              }
              active={subTab}
              onChange={setSubTab}
            />
          </div>
        </div>

        {/* Main Content */}
        <section className="py-12 px-4 md:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            {category === 'analysis' && subTab === 'pipeline' ? (
            <SketchUpPipelineTab />
            ) : category === 'convert' && subTab === 'format' ? (
            <FileConversion apiUrl={apiUrl} />
            ) : category === 'convert' && subTab === 'adjust' ? (
            <ImageProcessing apiUrl={apiUrl} />
            ) : category === 'simulate' && subTab === 'animation' ? (
            <TimelineAnimation apiUrl={apiUrl} />
            ) : category === 'compliance' && subTab === 'certification' ? (
            <CertificationChecklist />
            ) : category === 'compliance' && subTab === 'disability' ? (
            <DisabilityGlare results={pipelineResults?.results || []} />
            ) : category === 'generate' && subTab === 'sky' ? (
            <SkyGenerator apiUrl={apiUrl} />
            ) : category === 'generate' && subTab === 'model' ? (
            <BoxModelGenerator apiUrl={apiUrl} />
            ) : category === 'convert' && subTab === 'tone' ? (
            <ToneMapping apiUrl={apiUrl} />
            ) : category === 'generate' && subTab === 'material' ? (
            <MaterialLibrary apiUrl={apiUrl} />
            ) : category === 'analysis' && subTab === 'daylight' ? (
            <DaylightAnalysis apiUrl={apiUrl} />
            ) : category === 'simulate' && subTab === 'render' ? (
            <RenderScene apiUrl={apiUrl} />
            ) : (
            <ComingSoonContent category={category} subTab={subTab} />
            )}
          </div>
        </section>

        {/* Platform Info */}
        <section className="py-12 px-8 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="border border-gray-200 p-8">
              <h3 className="text-lg font-normal text-gray-900 mb-6">
                {t(txt.platformInfo)}
              </h3>

              <div className="grid md:grid-cols-3 gap-8 text-sm text-gray-700">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">{t(txt.coreEngine)}</h4>
                  <ul className="space-y-2 text-gray-800">
                    <li><span className="font-medium text-gray-900">pyradiance</span> 1.2.0</li>
                    <li><span className="font-medium text-gray-900">Radiance</span> 6.1 (BSD License)</li>
                    <li>{t(txt.pyFunctions)}</li>
                    <li>{t(txt.radBinaries)}</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">{t(txt.supportedFeatures)}</h4>
                  <ul className="space-y-2 text-gray-800 text-xs">
                    <li>{t(txt.featGlare)}</li>
                    <li>{t(txt.featDaylight)}</li>
                    <li>{t(txt.featSky)}</li>
                    <li>{t(txt.featImage)}</li>
                    <li>{t(txt.featConvert)}</li>
                    <li>{t(txt.feat3d)}</li>
                    <li>{t(txt.featRender)}</li>
                    <li>{t(txt.featBsdf)}</li>
                    <li>{t(txt.featCompliance)}</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">{t(txt.fileFormats)}</h4>
                  <ul className="space-y-2 text-gray-800 text-xs">
                    <li><span className="font-medium">{t(txt.input)}</span> .pic, .hdr, .tif, .exr</li>
                    <li><span className="font-medium">{t(txt.output)}</span> .tiff, .png, .ppm, .bmp</li>
                    <li><span className="font-medium">3D:</span> .obj, .rad, .oct</li>
                    <li><span className="font-medium">{t(txt.data)}</span> .xlsx, .csv, .json, .pdf</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-800">
                  BoLumiCloud |
                  EAN Technology Research Division |
                  pyradiance 1.2.0 + Radiance 6.1 |
                  {t(txt.version)}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}

export default function BoLumiCloudContent() {
  return (
    <ApiProvider>
      <PipelineProvider>
        <BoLumiCloudInner />
      </PipelineProvider>
    </ApiProvider>
  )
}
