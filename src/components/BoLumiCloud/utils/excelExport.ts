import type { AnalysisResponse } from '@/lib/types/glare'

/**
 * Downloads glare analysis results as an Excel file
 * Uses dynamic import to load xlsx library on demand
 *
 * @param results - Analysis response containing results and summary
 */
export async function downloadGlareExcel(results: AnalysisResponse): Promise<void> {
  // xlsx 라이브러리 동적 로드 (번들 최적화)
  const XLSX = await import('xlsx')

  const wb = XLSX.utils.book_new()

  // 01_결과 (전체)
  const ws1 = XLSX.utils.json_to_sheet(results.results)
  XLSX.utils.book_append_sheet(wb, ws1, '01_결과')

  // 02_불능현휘
  const disabilityData = results.results.filter(r => r.disability === 1)
  const ws2 = XLSX.utils.json_to_sheet(disabilityData)
  XLSX.utils.book_append_sheet(wb, ws2, '02_불능현휘')

  // 03_정상
  const normalData = results.results.filter(r => r.disability === 0)
  const ws3 = XLSX.utils.json_to_sheet(normalData)
  XLSX.utils.book_append_sheet(wb, ws3, '03_정상')

  // 04_요약
  const summaryData = [results.summary]
  const ws4 = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, ws4, '04_요약')

  // 파일 다운로드
  const fileName = `glare_analysis_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, fileName)
}
