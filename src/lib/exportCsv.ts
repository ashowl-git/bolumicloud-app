// CSV 내보내기 유틸.
// 한글 Excel 호환을 위해 UTF-8 BOM을 붙이고, 쉼표/따옴표/줄바꿈을 RFC 4180 규칙으로 이스케이프한다.

export interface CsvColumn<T> {
  /** 행 객체의 키 (value 미지정 시 사용) */
  key?: keyof T & string
  /** 헤더 라벨 */
  header: string
  /** 셀 값 계산 (key 대신) */
  value?: (row: T) => string | number | null | undefined
}

// 순수 숫자(부호·소수 허용). 정상 음수(-5)를 수식으로 오인하지 않기 위함.
const NUMERIC = /^[+-]?(\d+\.?\d*|\.\d+)$/

function escapeCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v)
  // CSV 수식 인젝션 방지: =, +, -, @, tab, CR 로 시작하면 Excel/Sheets 가 수식으로
  // 실행한다(예: '=HYPERLINK(...)'). 정상 숫자는 그대로 두고, 수식이 될 수 있는
  // 문자열만 앞에 작은따옴표를 붙여 텍스트로 강제한다(OWASP 권고).
  if (/^[=+\-@\t\r]/.test(s) && !NUMERIC.test(s)) {
    s = "'" + s
  }
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv<T extends object>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.header)).join(',')
  const body = rows.map((row) =>
    columns
      .map((c) => escapeCell(c.value ? c.value(row) : c.key ? (row as Record<string, unknown>)[c.key] : ''))
      .join(','),
  )
  return [header, ...body].join('\r\n')
}

/** CSV 문자열을 .csv 파일로 다운로드한다 (UTF-8 BOM 포함). */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** rows + columns → 파일 다운로드 (편의 함수). */
export function exportRowsToCsv<T extends object>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
): void {
  downloadCsv(filename, toCsv(rows, columns))
}
