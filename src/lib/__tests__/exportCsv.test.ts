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
})
