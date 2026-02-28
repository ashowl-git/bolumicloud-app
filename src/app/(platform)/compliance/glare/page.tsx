import DisabilityGlareAdapter from '@/components/BoLumiCloud/adapters/DisabilityGlareAdapter'

export const metadata = {
  title: '불능현휘',
}

export default function GlareCompliancePage() {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <DisabilityGlareAdapter />
      </div>
    </section>
  )
}
