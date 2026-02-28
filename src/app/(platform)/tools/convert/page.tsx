import FileConversion from '@/components/BoLumiCloud/FileConversion'

export const metadata = {
  title: '형식 변환',
}

export default function ConvertPage() {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <FileConversion />
      </div>
    </section>
  )
}
