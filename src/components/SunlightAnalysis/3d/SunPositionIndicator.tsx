'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import type { SolarPosition } from '@/lib/types/shadow'

// ─── SunPositionIndicator ─────────────────────────

interface SunPositionIndicatorProps {
  solarPosition: SolarPosition | null
  distance?: number
}

export default function SunPositionIndicator({
  solarPosition,
  distance = 80,
}: SunPositionIndicatorProps) {
  const sunPos = useMemo(() => {
    if (!solarPosition || solarPosition.altitude <= 0) return null

    const altRad = (solarPosition.altitude * Math.PI) / 180
    const aziRad = (solarPosition.azimuth * Math.PI) / 180

    // Three.js: X=동, Y=위, Z=북
    const x = Math.cos(altRad) * Math.sin(aziRad) * distance
    const y = Math.sin(altRad) * distance
    const z = Math.cos(altRad) * Math.cos(aziRad) * distance

    return new THREE.Vector3(x, y, z)
  }, [solarPosition, distance])

  if (!sunPos) return null

  return (
    <group>
      {/* 태양 구체 */}
      <mesh position={sunPos}>
        <sphereGeometry args={[3, 16, 16]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      {/* 태양 -> 원점 방향 선 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([sunPos.x, sunPos.y, sunPos.z, 0, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#fbbf24" transparent opacity={0.3} />
      </line>
    </group>
  )
}
