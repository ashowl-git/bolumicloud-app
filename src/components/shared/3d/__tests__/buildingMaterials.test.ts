import { describe, it, expect } from 'vitest'
import type * as THREE from 'three'
import { findGroupForMesh, GROUP_COLORS } from '../buildingMaterials'

// 부모 체인을 가진 최소 mock (THREE.Object3D 의 name/parent 만 사용)
function node(name: string, parent: unknown = null): THREE.Object3D {
  return { name, parent } as unknown as THREE.Object3D
}

describe('findGroupForMesh', () => {
  it('이름이 그룹명과 정확히 일치하면 그 그룹명 반환', () => {
    expect(findGroupForMesh(node('101동'), ['101동', '102동'])).toBe('101동')
  })

  it('이름이 그룹명으로 시작하면 매칭 (예: "101동-벽면")', () => {
    expect(findGroupForMesh(node('101동-벽면'), ['101동'])).toBe('101동')
  })

  it('자신에 이름이 없으면 부모 체인을 거슬러 올라가 매칭', () => {
    const mesh = node('', node('mesh_0', node('101동')))
    expect(findGroupForMesh(mesh, ['101동'])).toBe('101동')
  })

  it('어떤 조상도 매칭되지 않으면 null', () => {
    expect(findGroupForMesh(node('무관', node('상위')), ['101동'])).toBeNull()
  })

  it('그룹명 목록이 비면 null', () => {
    expect(findGroupForMesh(node('101동'), [])).toBeNull()
  })

  it('GROUP_COLORS 팔레트는 10색 제공', () => {
    expect(GROUP_COLORS).toHaveLength(10)
    expect(GROUP_COLORS.every((c) => /^#[0-9A-Fa-f]{6}$/.test(c))).toBe(true)
  })
})
