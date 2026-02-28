import SkyGenerator from '@/components/BoLumiCloud/SkyGenerator'

export const metadata = {
  title: '하늘 생성',
}

export default function SkyPage() {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <SkyGenerator />
      </div>
    </section>
  )
}
