'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { Line, Text } from '@react-three/drei'

// ─── Types ─────────────────────────────────

interface SunPosition3D {
  hour: number
  altitude: number
  azimuth: number
}

interface SunPath3D {
  label: string
  color: string
  positions: SunPosition3D[]
}

interface ObstructionRegion {
  points: Array<{ azimuth: number; altitude: number }>
}

interface SolarDiagram3DProps {
  sunPaths: SunPath3D[]
  obstructions?: ObstructionRegion[]
  hourlyStatus?: number[]
  radius?: number
  timeStart?: number
  timeEnd?: number
  stepMinutes?: number
}

// ─── Coordinate Transform ─────────────────

const DEG_TO_RAD = Math.PI / 180

function azAltToSphere(
  azDeg: number,
  altDeg: number,
  r: number,
): [number, number, number] {
  // azimuth: 0=South, clockwise -> Three.js: Z+ = looking direction
  // altitude: 0=horizon, 90=zenith
  const phi = (90 - altDeg) * DEG_TO_RAD  // polar angle from zenith
  const theta = (azDeg - 180) * DEG_TO_RAD // rotate so South faces camera
  const x = r * Math.sin(phi) * Math.sin(theta)
  const y = r * Math.cos(phi)
  const z = r * Math.sin(phi) * Math.cos(theta)
  return [x, y, z]
}

// ─── Sub-components ─────────────────────────

const PATH_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']

function HemisphereGrid({ radius }: { radius: number }) {
  const gridLines = useMemo(() => {
    const lines: Array<{ points: [number, number, number][]; color: string }> = []

    // Altitude circles (at 15, 30, 45, 60, 75 degrees)
    for (const alt of [15, 30, 45, 60, 75]) {
      const pts: [number, number, number][] = []
      for (let az = 0; az <= 360; az += 3) {
        pts.push(azAltToSphere(az, alt, radius))
      }
      lines.push({ points: pts, color: '#e2e8f0' })
    }

    // Horizon circle (altitude = 0)
    const horizonPts: [number, number, number][] = []
    for (let az = 0; az <= 360; az += 2) {
      horizonPts.push(azAltToSphere(az, 0, radius))
    }
    lines.push({ points: horizonPts, color: '#94a3b8' })

    // Azimuth lines (every 30 degrees = N, NNE, NE, etc.)
    for (let az = 0; az < 360; az += 30) {
      const pts: [number, number, number][] = []
      for (let alt = 0; alt <= 90; alt += 3) {
        pts.push(azAltToSphere(az, alt, radius))
      }
      lines.push({ points: pts, color: '#e2e8f0' })
    }

    return lines
  }, [radius])

  return (
    <>
      {gridLines.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          color={line.color}
          lineWidth={line.color === '#94a3b8' ? 1.5 : 0.8}
          transparent
          opacity={0.6}
        />
      ))}
    </>
  )
}

function CardinalLabels({ radius }: { radius: number }) {
  const r = radius * 1.12
  const labels = [
    { text: 'N', az: 0 },
    { text: 'E', az: 90 },
    { text: 'S', az: 180 },
    { text: 'W', az: 270 },
  ]

  return (
    <>
      {labels.map(({ text, az }) => {
        const [x, y, z] = azAltToSphere(az, 0, r)
        return (
          <Text
            key={text}
            position={[x, y + 0.3, z]}
            fontSize={0.8}
            color="#374151"
            anchorX="center"
            anchorY="middle"
            font={undefined}
          >
            {text}
          </Text>
        )
      })}
      {/* Zenith label */}
      <Text
        position={[0, radius + 0.5, 0]}
        fontSize={0.6}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        Z
      </Text>
    </>
  )
}

function SunPathCurve3D({
  path,
  radius,
}: {
  path: SunPath3D
  radius: number
}) {
  const linePoints = useMemo(() => {
    return path.positions
      .filter((p) => p.altitude > 0)
      .map((p) => azAltToSphere(p.azimuth, p.altitude, radius))
  }, [path.positions, radius])

  const hourlyMarkers = useMemo(() => {
    return path.positions
      .filter((p) => p.altitude > 0 && Math.abs(p.hour - Math.round(p.hour)) < 0.01)
      .map((p) => ({
        position: azAltToSphere(p.azimuth, p.altitude, radius),
        hour: Math.round(p.hour),
      }))
  }, [path.positions, radius])

  if (linePoints.length < 2) return null

  return (
    <>
      <Line
        points={linePoints}
        color={path.color}
        lineWidth={2.5}
      />
      {hourlyMarkers.map((m) => (
        <group key={`${path.label}-${m.hour}`} position={m.position}>
          <mesh>
            <sphereGeometry args={[0.25, 8, 8]} />
            <meshBasicMaterial color={path.color} />
          </mesh>
          <Text
            position={[0, 0.5, 0]}
            fontSize={0.4}
            color={path.color}
            anchorX="center"
            anchorY="bottom"
            font={undefined}
          >
            {`${m.hour}h`}
          </Text>
        </group>
      ))}
    </>
  )
}

function ObstructionOverlay({
  obstructions,
  radius,
}: {
  obstructions: ObstructionRegion[]
  radius: number
}) {
  const meshes = useMemo(() => {
    return obstructions.map((obs) => {
      if (obs.points.length < 3) return null

      // Create a shape on the hemisphere surface
      const vertices: number[] = []
      const indices: number[] = []

      // Center point (average of all points projected)
      let cx = 0, cy = 0, cz = 0
      const projected = obs.points.map((p) => {
        const [x, y, z] = azAltToSphere(p.azimuth, Math.max(0, p.altitude), radius * 0.99)
        cx += x; cy += y; cz += z
        return [x, y, z] as [number, number, number]
      })
      cx /= projected.length
      cy /= projected.length
      cz /= projected.length

      // Fan triangulation from center
      vertices.push(cx, cy, cz) // index 0 = center
      for (const [x, y, z] of projected) {
        vertices.push(x, y, z)
      }
      for (let i = 1; i < projected.length; i++) {
        indices.push(0, i, i + 1)
      }
      indices.push(0, projected.length, 1) // close

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
      geometry.setIndex(indices)
      geometry.computeVertexNormals()

      return geometry
    })
  }, [obstructions, radius])

  return (
    <>
      {meshes.map((geom, i) => {
        if (!geom) return null
        return (
          <mesh key={i} geometry={geom}>
            <meshBasicMaterial
              color="#475569"
              transparent
              opacity={0.35}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )
      })}
    </>
  )
}

// Translucent hemisphere surface
function HemisphereSurface({ radius }: { radius: number }) {
  const geometry = useMemo(() => {
    const geom = new THREE.SphereGeometry(radius * 0.98, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2)
    return geom
  }, [radius])

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color="#e0f2fe"
        transparent
        opacity={0.12}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// ─── Main Component ─────────────────────────

export default function SolarDiagram3D({
  sunPaths,
  obstructions,
  radius = 10,
}: SolarDiagram3DProps) {
  return (
    <group>
      {/* Translucent dome surface */}
      <HemisphereSurface radius={radius} />

      {/* Grid lines on hemisphere */}
      <HemisphereGrid radius={radius} />

      {/* Cardinal direction labels */}
      <CardinalLabels radius={radius} />

      {/* Sun path curves */}
      {sunPaths.map((path, i) => (
        <SunPathCurve3D
          key={path.label}
          path={{ ...path, color: path.color || PATH_COLORS[i % PATH_COLORS.length] }}
          radius={radius}
        />
      ))}

      {/* Obstruction overlays */}
      {obstructions && obstructions.length > 0 && (
        <ObstructionOverlay obstructions={obstructions} radius={radius} />
      )}

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[radius * 1.05, 64]} />
        <meshBasicMaterial color="#f1f5f9" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Center marker */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Ambient light for visibility */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 20, 10]} intensity={0.4} />
    </group>
  )
}
