import ToneMapping from '@/components/BoLumiCloud/ToneMapping'

export const metadata = {
  title: '톤 매핑',
}

export default function ToneMappingPage() {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <ToneMapping />
      </div>
    </section>
  )
}
