import DaylightAnalysis from '@/components/BoLumiCloud/DaylightAnalysis'

export const metadata = {
  title: '주광 분석',
}

export default function DaylightingPage() {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <DaylightAnalysis />
      </div>
    </section>
  )
}
