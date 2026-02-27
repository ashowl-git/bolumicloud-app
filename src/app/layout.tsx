import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://borumi.askwhy.works'),
  title: {
    default: 'BoLumiCloud | Lighting Analysis Dashboard',
    template: '%s | BoLumiCloud',
  },
  description: 'Radiance 기반 건축 조명 분석 통합 대시보드. pyradiance 110개 함수로 구현한 현휘(DGP/DGI), 일조, 3D 렌더링, 파일 변환, 재질 분석.',
  keywords: [
    'BoLumiCloud', 'Radiance', 'pyradiance', 'Glare Analysis',
    'DGP', 'DGI', 'Lighting', 'Daylight', '현휘 분석',
    '건축 조명', '일조 분석',
  ],
  authors: [{ name: 'EAN Technology', url: 'https://eantec.co.kr' }],
  creator: 'EAN Technology Research Division',
  openGraph: {
    title: 'BoLumiCloud - Lighting Analysis Dashboard',
    description: 'Radiance 기반 건축 조명 분석 통합 대시보드. 현휘, 일조, 3D 렌더링, 파일 변환.',
    url: 'https://borumi.askwhy.works',
    siteName: 'BoLumiCloud',
    locale: 'ko_KR',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#dc2626',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10001] focus:bg-slate-900 focus:text-white focus:px-6 focus:py-3 focus:rounded focus:shadow-lg"
        >
          본문으로 바로가기
        </a>
        <main id="main-content">
          {children}
        </main>
      </body>
    </html>
  )
}
