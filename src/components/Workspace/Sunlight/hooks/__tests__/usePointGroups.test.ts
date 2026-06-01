import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePointGroups } from '../usePointGroups'
import type { BaseAnalysisPoint } from '@/components/shared/3d/interaction/types'

// sn5f 다중그룹 임포트 무결성 — 2026-06-02 측정점 184→151 손실 회귀 가드.
// 근본원인: SunlightWorkspace 의 useEffect([placement.points]) → syncPointsToGroup 이
// 활성 그룹을 placement.points 로 통째 교체(REPLACE)하므로, 임포트 점을 placement 에
// 밀어넣으면(P2-13) sync 가 임포트 그룹을 덮어써 사라졌다. 수정: 임포트 시 placement
// push 제거 → pointGroups 가 측정점의 단일 진실원.

const importData = [
  { groupName: '101동', points: Array.from({ length: 39 }, (_, i) => ({ id: `a${i}`, x: i, y: 0, z: 0, name: `101_${i}` })) },
  { groupName: '102동', points: Array.from({ length: 60 }, (_, i) => ({ id: `b${i}`, x: i, y: 1, z: 0, name: `102_${i}` })) },
]

describe('usePointGroups — sn5f 다중그룹 임포트', () => {
  it('importGroups 가 모든 그룹의 점을 보존한다 (39+60=99, clobber 없음)', () => {
    const { result } = renderHook(() => usePointGroups())
    act(() => { result.current.importGroups(importData) })

    expect(result.current.totalPointCount).toBe(99)
    expect(result.current.allMeasurementPoints).toHaveLength(99)
    const counts = result.current.groups.map((g) => g.points.length)
    expect(counts).toContain(39)
    expect(counts).toContain(60)
  })

  it('[근본원인 가드] syncPointsToGroup 은 활성 그룹을 인자로 통째 교체한다 — 임포트 시 placement push 를 쓰면 안 되는 이유', () => {
    const { result } = renderHook(() => usePointGroups())
    act(() => { result.current.importGroups(importData) })

    // 임포트 직후 활성 그룹 = 첫 임포트 그룹(101동, 39점).
    // 과거엔 placement(예: stale 버그로 1점)를 sync 하여 활성 그룹이 1점으로 교체됨(184→151).
    const placementLike: BaseAnalysisPoint[] = [
      { id: 'x', position: { x: 0, y: 0, z: 0 }, threePosition: [0, 0, 0], name: 'x', surfaceType: 'wall' },
    ]
    act(() => { result.current.syncPointsToGroup(placementLike) })

    // 101동(39) → 1 로 교체, 102동(60) 유지 = 61. 이 손실 메커니즘 때문에 임포트는 pointGroups 만 쓴다.
    expect(result.current.totalPointCount).toBe(61)
  })
})
