import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SunlightResults from '../SunlightResults'
import type { SunlightAnalysisResult } from '@/lib/types/sunlight'

const mock = {
  session_id: 's1',
  analysis_date: { month: 12, day: 21, label: '동지' },
  location: { latitude: 37.5, longitude: 127.0, timezone_offset: 9, standard_meridian: 135 },
  building_type: 'apartment',
  time_window: { start: '08:00', end: '16:00', step_minutes: 10 },
  summary: {
    total_points: 2,
    compliant_points: 2,
    compliance_rate: 100,
    building_type: 'apartment',
    regulation_reference: '건축법 시행령 86조',
  },
  points: [
    { id: 'P1', x: 0, y: 0, z: 1, name: 'P1', total_hours: 4.5, continuous_hours: 2.5, hourly_status: [], compliant: true },
    { id: 'P2', x: 1, y: 0, z: 1, name: 'P2', total_hours: 3.0, continuous_hours: 1.5, hourly_status: [], compliant: false },
  ],
  metadata: { computation_time_sec: 12.3, triangle_count: 1000, sun_positions_computed: 49 },
} as unknown as SunlightAnalysisResult

describe('SunlightResults 요약+데이터 통합', () => {
  it('기본 "결과" 뷰에서 준수 요약과 데이터 표가 탭 전환 없이 함께 표시', () => {
    render(<SunlightResults results={mock} />)
    // 준수 요약 (compliance_rate)
    expect(screen.getByText(/100%/)).toBeTruthy()
    // 데이터 표 헤더 (같은 뷰에 함께 렌더 = 통합 확인)
    expect(screen.getByText('총일조(h)')).toBeTruthy()
  })

  it('빈 결과 → EmptyState', () => {
    const empty = { ...mock, points: [] } as unknown as SunlightAnalysisResult
    render(<SunlightResults results={empty} />)
    expect(screen.getByText('일조 분석 결과가 없습니다')).toBeTruthy()
  })
})
