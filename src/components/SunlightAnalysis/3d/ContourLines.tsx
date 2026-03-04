'use client'

import React, { useMemo } from 'react'
import { Line } from '@react-three/drei'
import type { IsochroneLine, ContourLineType } from '@/lib/types/sunlight'
import { backendToThree } from '@/components/shared/3d/interaction/types'

// ─── 색상 매핑 ────────────────────

const CONTOUR_COLORS: Record<ContourLineType, string> = {
  shadow: '#3b82f6',      // 파랑 (일영곡선)
  continuous: '#22c55e',   // 초록 (연속일조)
  total: '#ef4444',        // 빨강 (총일조)
}

const CONTOUR_LINE_WIDTH: Record<ContourLineType, number> = {
  shadow: 1.5,
  continuous: 2.0,
  total: 2.0,
}

// ─── ContourLines ────────────────────

interface ContourLinesProps {
  lines: IsochroneLine[]
  /** 표시할 유형 필터 (null이면 전부 표시) */
  visibleTypes?: ContourLineType[] | null
  yOffset?: number
}

function ContourLinesInner({
  lines,
  visibleTypes = null,
  yOffset = 0.06,
}: ContourLinesProps) {
  const filteredLines = useMemo(() => {
    if (!visibleTypes) return lines
    return lines.filter((l) => visibleTypes.includes(l.type))
  }, [lines, visibleTypes])

  const lineElements = useMemo(() => {
    return filteredLines.map((line, idx) => {
      // Backend (x=East, y=North) → Three.js (x=East, y=Up, z=North)
      const points: [number, number, number][] = line.coordinates.map(([bx, by]) => {
        const [tx, , tz] = backendToThree(bx, by, 0)
        return [tx, yOffset, tz]
      })

      if (points.length < 2) return null

      const color = CONTOUR_COLORS[line.type] || '#888888'
      const lineWidth = CONTOUR_LINE_WIDTH[line.type] || 1.5

      return {
        key: `${line.type}-${line.level}-${idx}`,
        points,
        color,
        lineWidth,
        level: line.level,
        type: line.type,
      }
    }).filter(Boolean) as {
      key: string
      points: [number, number, number][]
      color: string
      lineWidth: number
      level: number
      type: string
    }[]
  }, [filteredLines, yOffset])

  if (lineElements.length === 0) return null

  return (
    <group>
      {lineElements.map((el) => (
        <Line
          key={el.key}
          points={el.points}
          color={el.color}
          lineWidth={el.lineWidth}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      ))}
    </group>
  )
}

const ContourLines = React.memo(ContourLinesInner, (prev, next) => {
  return (
    prev.lines === next.lines &&
    prev.visibleTypes === next.visibleTypes &&
    prev.yOffset === next.yOffset
  )
})

export default ContourLines
