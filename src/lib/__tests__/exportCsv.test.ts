import { describe, it, expect } from 'vitest'
import { toCsv } from '@/lib/exportCsv'

describe('toCsv', () => {
  it('헤더 + 행 생성 (CRLF)', () => {
    const rows = [
      { id: 'P1', hours: 3.5 },
      { id: 'P2', hours: 0 },
    ]
    const csv = toCsv(rows, [
      { key: 'id', header: '측정점' },
      { key: 'hours', header: '일조시간' },
    ])
    expect(csv).toBe('측정점,일조시간\r\nP1,3.5\r\nP2,0')
  })

  it('쉼표·따옴표·줄바꿈 이스케이프 (RFC 4180)', () => {
    const rows = [{ name: 'a,b', note: 'he said "hi"' }]
    const csv = toCsv(rows, [
      { key: 'name', header: 'name' },
      { key: 'note', header: 'note' },
    ])
    expect(csv).toContain('"a,b"')
    expect(csv).toContain('"he said ""hi"""')
  })

  it('value 함수로 셀 계산', () => {
    const rows = [{ h: 3.567 }]
    const csv = toCsv(rows, [{ header: 'h', value: (r) => r.h.toFixed(2) }])
    expect(csv).toBe('h\r\n3.57')
  })

  it('null/undefined → 빈 셀', () => {
    const rows = [{ a: null, b: undefined, c: 0 }]
    const csv = toCsv(rows, [
      { key: 'a', header: 'a' },
      { key: 'b', header: 'b' },
      { key: 'c', header: 'c' },
    ])
    expect(csv).toBe('a,b,c\r\n,,0')
  })

  it('빈 행 → 헤더만', () => {
    expect(toCsv([], [{ key: 'x', header: 'X' }])).toBe('X')
  })

  it('수식 인젝션 방지: = + @ 로 시작하는 셀은 작은따옴표로 텍스트화', () => {
    const rows = [
      { g: '=HYPERLINK("http://evil","x")' },
      { g: '+1+2' },
      { g: '@SUM(A1)' },
    ]
    const csv = toCsv(rows, [{ key: 'g', header: '그룹' }])
    const lines = csv.split('\r\n')
    // 따옴표 이스케이프 포함( =HYPERLINK 는 " 가 있어 RFC 4180 인용 ) — 셀이 ' 로 시작
    expect(lines[1].startsWith("\"'=HYPERLINK") || lines[1].startsWith("'=HYPERLINK")).toBe(true)
    expect(lines[2]).toBe("'+1+2")
    expect(lines[3]).toBe("'@SUM(A1)")
  })

  it('정상 음수·숫자는 수식으로 오인하지 않는다', () => {
    const rows = [{ a: -5, b: 3.5, c: '+12.0' }]
    const csv = toCsv(rows, [
      { key: 'a', header: 'a' },
      { key: 'b', header: 'b' },
      { key: 'c', header: 'c' },
    ])
    expect(csv).toBe('a,b,c\r\n-5,3.5,+12.0')
  })
})
