import { useState, useCallback, useMemo } from 'react'
import type { BaseAnalysisPoint } from '@/components/shared/3d/interaction/types'
import type { MeasurementPoint, MeasurementPointGroup } from '@/lib/types/sunlight'

/**
 * 측정점 그룹 관리 훅.
 *
 * Sanalyst 호환 기능:
 * - 건물 동별 그룹 관리 (101동, 102동 등)
 * - 벽면 포인트를 행(층)/열(호) 기준으로 자동 정렬
 * - 열 순서 반전 옵션
 * - 아파트 동 단위 일괄 측정점 생성
 * - SN5F 그룹 임포트
 */

const DEFAULT_GROUP_NAME = '기본'

// ─── 배치 생성 / 임포트 타입 ───────────────────

export interface BatchPointParams {
  groupName: string
  startFloor: number
  endFloor: number
  floorHeight: number
  unitCount: number
  unitSpacing: number
  basePoint: { x: number; y: number; z: number }
  direction: { x: number; y: number }
}

export interface ImportGroupData {
  groupName: string
  points: { id: string; x: number; y: number; z: number; name: string }[]
}

// ─── 자동 행/열 정렬 알고리즘 ─────────────────

/**
 * 벽면에 배치된 포인트들을 높이(행=층)와 수평(열=호) 방향으로 자동 정렬.
 *
 * 알고리즘:
 * 1. Z좌표(높이)로 클러스터링 → 행(층) 결정
 * 2. 각 행 내에서 수평 방향(법선에 수직인 방향)으로 정렬 → 열(호) 결정
 * 3. 행은 아래→위 (1층부터), 열은 왼→오 (1호부터)
 *
 * 정렬 후 Sanalyst 스타일 [층,호] 이름을 부여한다.
 * startFloor가 지정되면 행 인덱스 + startFloor 을 층 번호로 사용.
 */
function autoSortPoints(
  points: MeasurementPoint[],
  reverseColumns: boolean,
  startFloor: number = 1,
): MeasurementPoint[] {
  if (points.length === 0) return []

  // 1. Z(높이) 기준으로 행 클러스터링
  // 같은 층의 포인트는 Z 좌표가 비슷함 (±1.5m 이내)
  const FLOOR_TOLERANCE = 1.5 // 같은 층 판정 허용치 (m)

  const sortedByZ = [...points].sort((a, b) => a.z - b.z)
  const rows: MeasurementPoint[][] = []
  let currentRow: MeasurementPoint[] = [sortedByZ[0]]

  for (let i = 1; i < sortedByZ.length; i++) {
    const prevZ = currentRow[currentRow.length - 1].z
    if (Math.abs(sortedByZ[i].z - prevZ) <= FLOOR_TOLERANCE) {
      currentRow.push(sortedByZ[i])
    } else {
      rows.push(currentRow)
      currentRow = [sortedByZ[i]]
    }
  }
  rows.push(currentRow)

  // 2. 각 행 내에서 수평 방향으로 정렬
  // X-Y 평면에서 주 수평 방향을 결정 (법선에 수직)
  const result: MeasurementPoint[] = []
  rows.forEach((row, rowIdx) => {
    // 수평 정렬: X 또는 Y 중 분산이 큰 축 기준으로 정렬
    const xs = row.map((p) => p.x)
    const ys = row.map((p) => p.y)
    const xRange = Math.max(...xs) - Math.min(...xs)
    const yRange = Math.max(...ys) - Math.min(...ys)

    // 주 수평 축으로 정렬
    const sorted = [...row].sort((a, b) => {
      if (xRange >= yRange) return a.x - b.x
      return a.y - b.y
    })

    if (reverseColumns) sorted.reverse()

    const floorNum = rowIdx + startFloor
    sorted.forEach((pt, colIdx) => {
      const unitNum = colIdx + 1
      result.push({
        ...pt,
        name: `[${floorNum},${unitNum}]`,
        row: rowIdx + 1,
        column: unitNum,
      })
    })
  })

  return result
}

// ─── 훅 ─────────────────────────────────────

export interface UsePointGroupsReturn {
  groups: MeasurementPointGroup[]
  activeGroupId: string | null
  /** 새 그룹 추가 */
  addGroup: (name: string) => void
  /** 그룹 제거 */
  removeGroup: (groupId: string) => void
  /** 그룹명 변경 */
  renameGroup: (groupId: string, name: string) => void
  /** 활성 그룹 변경 */
  setActiveGroup: (groupId: string) => void
  /** 열 순서 반전 토글 */
  toggleReverseColumns: (groupId: string) => void
  /** BaseAnalysisPoint[]를 활성 그룹에 동기화 */
  syncPointsToGroup: (points: BaseAnalysisPoint[]) => void
  /** 자동 행/열 정렬 실행 */
  sortGroup: (groupId: string) => void
  /** 모든 그룹의 포인트를 MeasurementPoint[]로 평탄화 (API 전송용) */
  allMeasurementPoints: MeasurementPoint[]
  /** 그룹 수 통계 */
  totalPointCount: number
  /** 아파트 동 단위 측정점 일괄 생성 */
  batchCreatePoints: (params: BatchPointParams) => void
  /** SN5F 데이터에서 그룹 임포트 */
  importGroups: (groups: ImportGroupData[]) => void
  /** 그룹의 포인트를 교체 */
  setGroupPoints: (groupId: string, points: MeasurementPoint[]) => void
}

let groupIdCounter = 1

export function usePointGroups(): UsePointGroupsReturn {
  const [groups, setGroups] = useState<MeasurementPointGroup[]>([
    {
      id: 'g1',
      name: DEFAULT_GROUP_NAME,
      points: [],
      sorted: false,
      reverseColumns: false,
    },
  ])
  const [activeGroupId, setActiveGroupId] = useState<string | null>('g1')

  const addGroup = useCallback((name: string) => {
    const id = `g${++groupIdCounter}`
    setGroups((prev) => [
      ...prev,
      { id, name, points: [], sorted: false, reverseColumns: false },
    ])
    setActiveGroupId(id)
  }, [])

  const removeGroup = useCallback((groupId: string) => {
    setGroups((prev) => {
      const filtered = prev.filter((g) => g.id !== groupId)
      if (filtered.length === 0) {
        const id = `g${++groupIdCounter}`
        return [{ id, name: DEFAULT_GROUP_NAME, points: [], sorted: false, reverseColumns: false }]
      }
      return filtered
    })
    setActiveGroupId((prev) => {
      if (prev === groupId) return groups[0]?.id ?? null
      return prev
    })
  }, [groups])

  const renameGroup = useCallback((groupId: string, name: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name } : g))
    )
  }, [])

  const setActiveGroup = useCallback((groupId: string) => {
    setActiveGroupId(groupId)
  }, [])

  const toggleReverseColumns = useCallback((groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g
        const reversed = !g.reverseColumns
        const sorted = autoSortPoints(g.points, reversed)
        return { ...g, reverseColumns: reversed, points: sorted, sorted: true }
      })
    )
  }, [])

  const syncPointsToGroup = useCallback((basePoints: BaseAnalysisPoint[]) => {
    if (!activeGroupId) return
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== activeGroupId) return g
        const pts: MeasurementPoint[] = basePoints.map((bp) => ({
          id: bp.id,
          x: bp.position.x,
          y: bp.position.y,
          z: bp.position.z,
          name: bp.name,
          group: g.name,
          row: undefined,
          column: undefined,
        }))
        return { ...g, points: pts, sorted: false }
      })
    )
  }, [activeGroupId])

  const sortGroup = useCallback((groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g
        const sorted = autoSortPoints(g.points, g.reverseColumns)
        return { ...g, points: sorted, sorted: true }
      })
    )
  }, [])

  // ─── Phase 4: 일괄 생성 / 임포트 ─────────────

  const batchCreatePoints = useCallback((params: BatchPointParams) => {
    const {
      groupName, startFloor, endFloor, floorHeight,
      unitCount, unitSpacing, basePoint, direction,
    } = params

    const points: MeasurementPoint[] = []
    let ptIdx = 0

    for (let floor = startFloor; floor <= endFloor; floor++) {
      for (let unit = 1; unit <= unitCount; unit++) {
        const dx = (unit - 1) * unitSpacing * direction.x
        const dy = (unit - 1) * unitSpacing * direction.y
        const dz = (floor - startFloor) * floorHeight

        points.push({
          id: `bp_${Date.now()}_${ptIdx++}`,
          x: basePoint.x + dx,
          y: basePoint.y + dy,
          z: basePoint.z + dz,
          name: `[${floor},${unit}]`,
          group: groupName,
          row: floor - startFloor + 1,
          column: unit,
        })
      }
    }

    const id = `g${++groupIdCounter}`
    setGroups((prev) => [
      ...prev,
      { id, name: groupName, points, sorted: true, reverseColumns: false },
    ])
    setActiveGroupId(id)
  }, [])

  const importGroups = useCallback((importData: ImportGroupData[]) => {
    const newGroups: MeasurementPointGroup[] = importData.map((gd) => {
      const id = `g${++groupIdCounter}`
      const pts: MeasurementPoint[] = gd.points.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        z: p.z,
        name: p.name,
        group: gd.groupName,
      }))
      return { id, name: gd.groupName, points: pts, sorted: false, reverseColumns: false }
    })

    setGroups((prev) => [...prev, ...newGroups])
    if (newGroups.length > 0) {
      setActiveGroupId(newGroups[0].id)
    }
  }, [])

  const setGroupPoints = useCallback((groupId: string, points: MeasurementPoint[]) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, points, sorted: false } : g))
    )
  }, [])

  const allMeasurementPoints = useMemo((): MeasurementPoint[] => {
    return groups.flatMap((g) =>
      g.points.map((p) => ({ ...p, group: g.name }))
    )
  }, [groups])

  const totalPointCount = useMemo(
    () => groups.reduce((sum, g) => sum + g.points.length, 0),
    [groups]
  )

  return {
    groups,
    activeGroupId,
    addGroup,
    removeGroup,
    renameGroup,
    setActiveGroup,
    toggleReverseColumns,
    syncPointsToGroup,
    sortGroup,
    allMeasurementPoints,
    totalPointCount,
    batchCreatePoints,
    importGroups,
    setGroupPoints,
  }
}
