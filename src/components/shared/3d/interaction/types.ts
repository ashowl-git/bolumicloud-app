// 3D 인터랙션 공유 타입 (BoLumiCloud)
//
// 좌표 규약:
//   Backend (Z-up):  X=동(East), Y=북(North), Z=위(Up)
//   Three.js (Y-up): X=동(East), Y=위(Up),   Z=남(South)
//
//   SketchUp OBJ Y-up → Three.js Y-up: 동일 (zUp:false)
//   Three.js → Backend: Y↔Z 교환 + Z 부호 반전
//
//   backendToThree(bx, by, bz) => [bx, bz, -by]
//   threeToBackend(tx, ty, tz) => { x: tx, y: -tz, z: ty }
//   법선도 동일 규칙 적용

// ─── 인터랙션 모드 ─────────────────────────────

export type InteractionMode = 'navigate' | 'place_point' | 'place_area' | 'delete' | 'select' | 'transform'

// ─── 표면 유형 ─────────────────────────────

export type SurfaceType = 'ground' | 'wall' | 'roof'

// ─── 레이캐스트 결과 ─────────────────────────────

export interface SurfaceHit {
  point: [number, number, number]       // Three.js 좌표
  normal: [number, number, number]      // Three.js 월드 법선
  faceIndex: number
  objectName: string
  surfaceType: SurfaceType
  distance: number
  groupName?: string                    // 건물 그룹명 (e.g., "101동")
}

// ─── 분석 포인트 기본 타입 ─────────────────────────

export interface BaseAnalysisPoint {
  id: string
  name: string
  position: { x: number; y: number; z: number }  // 백엔드 좌표 (X동, Y북, Z위)
  threePosition: [number, number, number]         // Three.js 좌표
  surfaceType: SurfaceType
  normal?: { dx: number; dy: number; dz: number } // 백엔드 법선
}

// ─── 좌표 변환 유틸리티 ─────────────────────────

export function backendToThree(bx: number, by: number, bz: number): [number, number, number] {
  return [bx, bz, -by]
}

export function threeToBackend(tx: number, ty: number, tz: number): { x: number; y: number; z: number } {
  return { x: tx, y: -tz, z: ty }
}

export function threeNormalToBackend(nx: number, ny: number, nz: number): { dx: number; dy: number; dz: number } {
  return { dx: nx, dy: -nz, dz: ny }
}

export function backendNormalToThree(dx: number, dy: number, dz: number): [number, number, number] {
  return [dx, dz, -dy]
}
