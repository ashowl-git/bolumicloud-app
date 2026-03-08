'use client'

interface SceneLightingProps {
  sunDirection?: [number, number, number]
  ambientIntensity?: number
  directionalIntensity?: number
  enableShadow?: boolean
  shadowCameraSize?: number
}

export default function SceneLighting({
  sunDirection = [50, 80, 30],
  ambientIntensity = 0.6,
  directionalIntensity = 0.8,
  enableShadow = false,
  shadowCameraSize,
}: SceneLightingProps) {
  const camSize = shadowCameraSize || 100
  return (
    <>
      <ambientLight intensity={ambientIntensity} color="#ffffff" />
      <directionalLight
        position={sunDirection}
        intensity={directionalIntensity}
        color="#ffffff"
        castShadow={enableShadow}
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-camera-near={0.5}
        shadow-camera-far={camSize * 5}
        shadow-camera-left={-camSize}
        shadow-camera-right={camSize}
        shadow-camera-top={camSize}
        shadow-camera-bottom={-camSize}
      />
      <hemisphereLight
        args={['#87ceeb', '#f5f5f0', 0.3]}
      />
    </>
  )
}
