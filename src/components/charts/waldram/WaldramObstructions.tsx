import React from 'react'

interface ProjectedObstruction {
  name: string
  color: string
  svgPoints: Array<{ sx: number; sy: number; az: number; alt: number }>
}

interface WaldramObstructionsProps {
  projectedObstructions: ProjectedObstruction[]
  editable: boolean
  selectedIdx: number | null
  onSelect: (idx: number | null) => void
  onVertexMouseDown: (obsIdx: number, vertexIdx: number, e: React.MouseEvent) => void
  fromSvgCoords: (svgX: number, svgY: number) => { azDeg: number; altDeg: number }
  onHover: (point: { x: number; y: number; az: number; alt: number; name?: string } | null) => void
}

export default function WaldramObstructions({
  projectedObstructions,
  editable,
  selectedIdx,
  onSelect,
  onVertexMouseDown,
  fromSvgCoords,
  onHover,
}: WaldramObstructionsProps) {
  return (
    <>
      {projectedObstructions.map((obs, idx) => {
        const pointsStr = obs.svgPoints.map((p) => `${p.sx},${p.sy}`).join(' ')
        const isSelected = selectedIdx === idx
        return (
          <g key={obs.name + idx}>
            <polygon
              points={pointsStr}
              fill={obs.color}
              fillOpacity={isSelected ? 0.5 : 0.3}
              stroke={obs.color}
              strokeWidth={isSelected ? 2 : 1}
              strokeLinejoin="round"
              className={editable ? 'cursor-move' : 'cursor-pointer transition-opacity duration-200'}
              onClick={
                !editable
                  ? () => onSelect(isSelected ? null : idx)
                  : undefined
              }
              onMouseMove={
                !editable
                  ? (e) => {
                      const svg = e.currentTarget.ownerSVGElement
                      if (!svg) return
                      const pt = svg.createSVGPoint()
                      pt.x = e.clientX
                      pt.y = e.clientY
                      const ctm = svg.getScreenCTM()
                      if (!ctm) return
                      const svgP = pt.matrixTransform(ctm.inverse())
                      const coords = fromSvgCoords(svgP.x, svgP.y)
                      if (coords.altDeg < 0 || coords.altDeg > 90) return
                      onHover({
                        x: svgP.x,
                        y: svgP.y,
                        az: coords.azDeg,
                        alt: coords.altDeg,
                        name: obs.name,
                      })
                    }
                  : undefined
              }
            />
            {/* Polygon vertices */}
            {obs.svgPoints.map((p, pi) => (
              <circle
                key={pi}
                cx={p.sx}
                cy={p.sy}
                r={editable ? 5 : isSelected ? 4 : 2.5}
                fill={obs.color}
                stroke="white"
                strokeWidth={1}
                style={{ cursor: editable ? 'grab' : 'default' }}
                onMouseDown={
                  editable
                    ? (e) => onVertexMouseDown(idx, pi, e)
                    : undefined
                }
              />
            ))}
          </g>
        )
      })}
    </>
  )
}
