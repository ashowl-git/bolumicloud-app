import * as THREE from 'three'

// BuildingModel 과 InteractiveBuildingModel 이 공유하는 재질 상수·그룹 헬퍼.
// (이전: 두 컴포넌트에 동일 코드가 중복 정의되어 있었다)

// EdgesGeometry 생성 임계값: 총 face 수가 이 값 초과 시 와이어프레임 비활성화
export const WIREFRAME_FACE_LIMIT = 50000

export const WIREFRAME_MATERIAL = new THREE.LineBasicMaterial({
  color: '#9ca3af',
  linewidth: 1,
})

// 그룹별 색상 팔레트 (그룹에 color 가 없을 때 인덱스로 순환 배정)
export const GROUP_COLORS = [
  '#7CB9E8', '#B284BE', '#72BF6A', '#F0A868', '#E8747C',
  '#6ECFCF', '#D4A76A', '#9B9B9B', '#A8D8B9', '#C4B5E0',
]

/** 메시 자신 또는 조상의 이름으로 소속 그룹명을 찾는다. 부모 체인을 거슬러
 *  올라가며 정확히 일치하거나 그룹명으로 시작하는 첫 이름을 반환한다. */
export function findGroupForMesh(
  mesh: THREE.Object3D,
  groupNames: string[],
): string | null {
  let current: THREE.Object3D | null = mesh
  while (current) {
    if (current.name) {
      const name = current.name
      const matched = groupNames.find((g) => name === g || name.startsWith(g))
      if (matched) return matched
    }
    current = current.parent
  }
  return null
}
