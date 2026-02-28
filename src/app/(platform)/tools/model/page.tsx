import BoxModelGenerator from '@/components/BoLumiCloud/BoxModelGenerator'

export const metadata = {
  title: '3D 모델',
}

export default function ModelPage() {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <BoxModelGenerator />
      </div>
    </section>
  )
}
