import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&accept-language=ko`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'BoLumiCloud/1.0 (borumi.askwhy.works)' },
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: `Nominatim returned ${res.status}` },
      { status: res.status },
    )
  }

  const data = await res.json()
  return NextResponse.json(data)
}
