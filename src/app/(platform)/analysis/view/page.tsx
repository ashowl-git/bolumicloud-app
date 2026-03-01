import ViewPipelineWrapper from '@/components/ViewAnalysis/ViewPipelineWrapper'

export const metadata = {
  title: '조망 분석',
}

export default function ViewAnalysisPage() {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <ViewPipelineWrapper />
      </div>
    </section>
  )
}
