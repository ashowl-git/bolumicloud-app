'use client'

import type { ComponentType } from 'react'
import { usePipelineContext } from '@/contexts/PipelineContext'

import SketchUpPipelineTab from '@/components/BoLumiCloud/tabs/SketchUpPipelineTab'
import FileConversion from '@/components/BoLumiCloud/FileConversion'
import ImageProcessing from '@/components/BoLumiCloud/ImageProcessing'
import TimelineAnimation from '@/components/BoLumiCloud/TimelineAnimation'
import CertificationChecklist from '@/components/BoLumiCloud/CertificationChecklist'
import SkyGenerator from '@/components/BoLumiCloud/SkyGenerator'
import BoxModelGenerator from '@/components/BoLumiCloud/BoxModelGenerator'
import ToneMapping from '@/components/BoLumiCloud/ToneMapping'
import MaterialLibrary from '@/components/BoLumiCloud/MaterialLibrary'
import DaylightAnalysis from '@/components/BoLumiCloud/DaylightAnalysis'
import RenderScene from '@/components/BoLumiCloud/RenderScene'
import DisabilityGlare from '@/components/BoLumiCloud/DisabilityGlare'

// Adapter for DisabilityGlare that gets results from PipelineContext
function DisabilityGlareAdapter() {
  const { results: pipelineResults } = usePipelineContext()
  return <DisabilityGlare results={pipelineResults?.results || []} />
}

export const CONTENT_MAP: Record<string, ComponentType> = {
  'analysis-pipeline': SketchUpPipelineTab,
  'analysis-daylight': DaylightAnalysis,
  'convert-format': FileConversion,
  'convert-tone': ToneMapping,
  'convert-adjust': ImageProcessing,
  'generate-sky': SkyGenerator,
  'generate-model': BoxModelGenerator,
  'generate-material': MaterialLibrary,
  'simulate-render': RenderScene,
  'simulate-animation': TimelineAnimation,
  'compliance-disability': DisabilityGlareAdapter,
  'compliance-certification': CertificationChecklist,
}
