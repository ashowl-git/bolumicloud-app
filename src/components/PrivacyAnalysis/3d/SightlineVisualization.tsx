'use client'

import { useMemo, useState } from 'react'
import { Line, Html } from '@react-three/drei'
import type { PairResult } from '@/lib/types/privacy'

// ─── 상수 ──────────────────────────────────────
const GRADE_COLORS: Record<number, string> = {
  1: '#dc2626', // red
  2: '#d97706', // yellow/amber
  3: '#16a34a', // green
}

// ─── 좌표 변환: 백엔드(X=동, Y=북, Z=위) → Three.js(X=동, Y=위, Z=남) ──
function backendToThree(x: number, y: number, z: number): [number, number, number] {
  return [x, z, -y]
}

// ─── PII → opacity 변환 (0.3 ~ 0.9) ────────────
function piiToOpacity(pii: number): number {
  return Math.min(0.9, Math.max(0.3, pii * 0.9))
}

// ─── SightlineVisualization ────────────────────

interface SightlineVisualizationProps {
  pairs: PairResult[]
  gradeFilter: { 1: boolean; 2: boolean; 3: boolean }
  selectedPairId: number | null
  onPairSelect: (id: number) => void
}

export default function SightlineVisualization({
  pairs,
  gradeFilter,
  selectedPairId,
  onPairSelect,
}: SightlineVisualizationProps) {
  const [hoveredPairId, setHoveredPairId] = useState<number | null>(null)

  const visiblePairs = useMemo(
    () => pairs.filter((p) => gradeFilter[p.grade as 1 | 2 | 3]),
    [pairs, gradeFilter],
  )

  return (
    <group>
      {visiblePairs.map((pair) => {
        const obs = pair.observer.coordinates
        const tgt = pair.target.coordinates

        const start = backendToThree(obs.x, obs.y, obs.z)
        const end = backendToThree(tgt.x, tgt.y, tgt.z)

        const color = GRADE_COLORS[pair.grade] ?? '#9ca3af'
        const opacity = piiToOpacity(pair.pii)
        const isSelected = pair.id === selectedPairId
        const isHovered = pair.id === hoveredPairId
        const isBlocked = pair.line_of_sight_blocked

        // 선택/호버 시 강조
        const lineWidth = isSelected ? 4 : isHovered ? 3 : isBlocked ? 1 : 2

        // 차단된 가시선은 점선 효과를 위해 짧은 세그먼트로 분할
        const points: [number, number, number][] = isBlocked
          ? buildDashedPoints(start, end, 0.6, 0.4)
          : [start, end]

        return (
          <group key={pair.id}>
            {isBlocked ? (
              // 차단된 선: 세그먼트 단위로 렌더링 (점선 효과)
              <DashedSightline
                start={start}
                end={end}
                color={color}
                opacity={opacity * 0.5}
                lineWidth={lineWidth}
                pairId={pair.id}
                onHover={setHoveredPairId}
                onSelect={onPairSelect}
              />
            ) : (
              <Line
                points={points}
                color={color}
                lineWidth={lineWidth}
                transparent
                opacity={opacity}
                onPointerOver={(e) => { e.stopPropagation(); setHoveredPairId(pair.id) }}
                onPointerOut={() => setHoveredPairId(null)}
                onClick={(e) => { e.stopPropagation(); onPairSelect(pair.id) }}
              />
            )}

            {/* 호버 툴팁 */}
            {isHovered && (
              <Html
                position={[
                  (start[0] + end[0]) / 2,
                  (start[1] + end[1]) / 2 + 1,
                  (start[2] + end[2]) / 2,
                ]}
                style={{ pointerEvents: 'none' }}
              >
                <div className="bg-white border border-gray-200 shadow-lg p-2 text-xs whitespace-nowrap rounded">
                  <div className="font-medium text-gray-900">
                    {pair.observer.id} → {pair.target.id}
                  </div>
                  <div className="text-gray-600 mt-0.5">
                    등급 {pair.grade} | PII {pair.pii.toFixed(3)} | {pair.distance.toFixed(1)}m
                  </div>
                  {isBlocked && (
                    <div className="text-gray-400">차단됨 (blocked)</div>
                  )}
                </div>
              </Html>
            )}

            {/* 선택된 쌍 하이라이트 */}
            {isSelected && (
              <Html
                position={[
                  (start[0] + end[0]) / 2,
                  (start[1] + end[1]) / 2 + 2,
                  (start[2] + end[2]) / 2,
                ]}
                style={{ pointerEvents: 'none' }}
              >
                <div className="bg-red-600 text-white px-2 py-1 text-xs rounded shadow-lg whitespace-nowrap">
                  선택됨: {pair.observer.id} → {pair.target.id}
                </div>
              </Html>
            )}
          </group>
        )
      })}
    </group>
  )
}

// ─── 점선 세그먼트 생성 헬퍼 ────────────────────

function buildDashedPoints(
  start: [number, number, number],
  end: [number, number, number],
  dashLength: number,
  gapLength: number,
): [number, number, number][] {
  const totalLen = Math.sqrt(
    (end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2 + (end[2] - start[2]) ** 2,
  )
  const dx = (end[0] - start[0]) / totalLen
  const dy = (end[1] - start[1]) / totalLen
  const dz = (end[2] - start[2]) / totalLen

  const pts: [number, number, number][] = []
  let t = 0

  while (t < totalLen) {
    const dashEnd = Math.min(t + dashLength, totalLen)
    pts.push([start[0] + dx * t, start[1] + dy * t, start[2] + dz * t])
    pts.push([start[0] + dx * dashEnd, start[1] + dy * dashEnd, start[2] + dz * dashEnd])
    t = dashEnd + gapLength
  }

  return pts
}

// ─── 차단된 가시선 컴포넌트 ─────────────────────

interface DashedSightlineProps {
  start: [number, number, number]
  end: [number, number, number]
  color: string
  opacity: number
  lineWidth: number
  pairId: number
  onHover: (id: number | null) => void
  onSelect: (id: number) => void
}

function DashedSightline({
  start,
  end,
  color,
  opacity,
  lineWidth,
  pairId,
  onHover,
  onSelect,
}: DashedSightlineProps) {
  const segments = useMemo(() => buildDashedPoints(start, end, 0.6, 0.4), [start, end])

  // 점선: 2개씩 쌍으로 묶어 세그먼트 렌더링
  const pairs: Array<[[number, number, number], [number, number, number]]> = []
  for (let i = 0; i < segments.length - 1; i += 2) {
    pairs.push([segments[i], segments[i + 1]])
  }

  return (
    <group>
      {pairs.map((seg, idx) => (
        <Line
          key={idx}
          points={seg}
          color={color}
          lineWidth={lineWidth}
          transparent
          opacity={opacity}
          onPointerOver={(e) => { e.stopPropagation(); onHover(pairId) }}
          onPointerOut={() => onHover(null)}
          onClick={(e) => { e.stopPropagation(); onSelect(pairId) }}
        />
      ))}
    </group>
  )
}
