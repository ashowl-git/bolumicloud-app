import RenderScene from '@/components/BoLumiCloud/RenderScene'

export const metadata = {
  title: '3D 렌더링',
}

export default function RenderPage() {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <RenderScene />
      </div>
    </section>
  )
}
