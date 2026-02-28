import TimelineAnimation from '@/components/BoLumiCloud/TimelineAnimation'

export const metadata = {
  title: '애니메이션',
}

export default function AnimationPage() {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <TimelineAnimation />
      </div>
    </section>
  )
}
