// 업로드 파일을 gzip 압축한다.
//
// 대용량 sn5f(텍스트)는 ~4-5배 압축되어 Cloudflare 터널 통과가 빨라지고,
// 느린 전송 중 연결이 끊기는 문제를 줄인다. 백엔드는 gzip 매직바이트로 투명
// 판별해 압축/비압축을 모두 받으므로, 압축 실패·미지원 시 원본을 그대로 보낸다.

/** 파일을 gzip 압축한 File 로 반환한다(이름 보존). 불가 시 원본 반환. */
export async function gzipFile(file: File): Promise<File> {
  // CompressionStream 미지원 브라우저는 원본 그대로
  if (typeof CompressionStream === 'undefined') return file
  try {
    const stream = file.stream().pipeThrough(new CompressionStream('gzip'))
    const blob = await new Response(stream).blob()
    // 압축이 외려 커지면(드묾) 원본 사용
    if (blob.size >= file.size) return file
    return new File([blob], file.name, { type: 'application/gzip' })
  } catch {
    return file
  }
}
