'use client'

interface SceneLightingProps {
  sunDirection?: [number, number, number]
  ambientIntensity?: number
  directionalIntensity?: number
}

export default function SceneLighting({
  sunDirection = [50, 80, 30],
  ambientIntensity = 0.6,
  directionalIntensity = 0.8,
}: SceneLightingProps) {
  return (
    <>
      <ambientLight intensity={ambientIntensity} color="#ffffff" />
      <directionalLight
        position={sunDirection}
        intensity={directionalIntensity}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={500}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <hemisphereLight
        args={['#87ceeb', '#f5f5f0', 0.3]}
      />
    </>
  )
}
