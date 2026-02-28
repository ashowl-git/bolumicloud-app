import SketchUpPipelineTab from '@/components/BoLumiCloud/tabs/SketchUpPipelineTab'

export const metadata = {
  title: '현휘 분석',
}

export default function GlareAnalysisPage() {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <SketchUpPipelineTab />
      </div>
    </section>
  )
}
