import SunlightPipelineWrapper from '@/components/SunlightAnalysis/SunlightPipelineWrapper'

export const metadata = {
  title: '일조 분석',
}

export default function SunlightPage() {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <SunlightPipelineWrapper />
      </div>
    </section>
  )
}
