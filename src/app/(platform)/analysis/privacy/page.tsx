import PrivacyPipelineWrapper from '@/components/PrivacyAnalysis/PrivacyPipelineWrapper'

export const metadata = {
  title: '사생활 분석',
}

export default function PrivacyAnalysisPage() {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <PrivacyPipelineWrapper />
      </div>
    </section>
  )
}
