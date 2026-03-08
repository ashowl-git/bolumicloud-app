'use client'

interface CSMLightingProps {
  sunDirection?: [number, number, number]
  ambientIntensity?: number
  directionalIntensity?: number
}

/**
 * 태양 동기화 조명 컴포넌트 (SolarPV 전용).
 *
 * GPU shadow map 제거 사유:
 * - Three.js r170 + three-stdlib CSM 셰이더 비호환 (#include <lights_pars_begin> 오류)
 * - 단일 DirectionalLight shadow map → 대형 건축 장면(100m+)에서 shadow acne 반복
 *   - 근본 원인: sceneBounds useMemo가 모델 로드 전에 실행 → frustum 미스매치
 *   - 지반 메시의 grazing angle + 낮은 normalBias → 줄무늬 아티팩트
 *
 * 건물 그림자는 ShadowOverlay (백엔드 폴리곤 기반)로 렌더링한다.
 */
export default function CSMLighting({
  sunDirection = [50, 80, -30],
  ambientIntensity = 0.6,
  directionalIntensity = 0.8,
}: CSMLightingProps) {
  return (
    <>
      <ambientLight intensity={ambientIntensity} color="#ffffff" />
      <directionalLight
        position={sunDirection}
        intensity={directionalIntensity}
        color="#ffffff"
      />
      <hemisphereLight args={['#87ceeb', '#f5f5f0', 0.3]} />
    </>
  )
}
