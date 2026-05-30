import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProgressStep from '../ProgressStep'
import type { SunlightProgress } from '@/lib/types/sunlight'

const errorProgress = {
  stages: [],
  stage_progress: { completed: 0, total: 0 },
  overall_progress: 0,
  elapsed_sec: 1,
  status: 'error',
  error: '분석 실패: 테스트 오류',
} as unknown as SunlightProgress

describe('ProgressStep 에러/재시도', () => {
  it('에러 메시지를 alert로 표시', () => {
    render(
      <ProgressStep progress={errorProgress} estimatedRemainingSec={null} isRunning={false} onCancel={() => {}} />,
    )
    expect(screen.getByText('분석 실패: 테스트 오류')).toBeTruthy()
  })

  it('onRetry 제공 시 "다시 시도" 버튼 + 클릭 시 호출', () => {
    const onRetry = vi.fn()
    render(
      <ProgressStep
        progress={errorProgress}
        estimatedRemainingSec={null}
        isRunning={false}
        onCancel={() => {}}
        onRetry={onRetry}
      />,
    )
    const btn = screen.getByRole('button', { name: '다시 시도' })
    fireEvent.click(btn)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('onRetry 미제공 시 재시도 버튼 없음', () => {
    render(
      <ProgressStep progress={errorProgress} estimatedRemainingSec={null} isRunning={false} onCancel={() => {}} />,
    )
    expect(screen.queryByRole('button', { name: '다시 시도' })).toBe(null)
  })
})
