import ImageProcessing from '@/components/BoLumiCloud/ImageProcessing'

export const metadata = {
  title: '이미지 처리',
}

export default function ImagePage() {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <ImageProcessing />
      </div>
    </section>
  )
}
