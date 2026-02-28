import CertificationChecklist from '@/components/BoLumiCloud/CertificationChecklist'

export const metadata = {
  title: '인증 체크리스트',
}

export default function CertificationPage() {
  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <CertificationChecklist />
      </div>
    </section>
  )
}
