import MaterialLibrary from '@/components/BoLumiCloud/MaterialLibrary'

export const metadata = {
  title: '재질 라이브러리',
}

export default function MaterialPage() {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <MaterialLibrary />
      </div>
    </section>
  )
}
