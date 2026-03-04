'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Globe2, Crosshair } from 'lucide-react'
import { sunPosition } from '@/components/charts/sunpath/solar-position'
import { defaultDates, DATE_COLORS, dateLabel } from '@/components/charts/sunpath/defaults'
import WorkspacePanelSection from '../Workspace/WorkspacePanelSection'

const ThreeViewer = dynamic(() => import('@/components/shared/3d/ThreeViewer'), { ssr: false })
const SolarDiagram3D = dynamic(() => import('./3d/SolarDiagram3D'), { ssr: false })

interface SolarDiagram3DSectionProps {
  latitude: number
  longitude: number
  selectedPointId?: string | null
}

export default function SolarDiagram3DSection({
  latitude,
  longitude,
  selectedPointId,
}: SolarDiagram3DSectionProps) {
  // Compute sun paths for 4 key dates (solstices + equinoxes)
  const dates = useMemo(() => defaultDates(), [])

  const sunPaths = useMemo(() => {
    return dates.map((date, di) => {
      const positions: Array<{ hour: number; altitude: number; azimuth: number }> = []
      for (let h = 4; h <= 20; h += 10 / 60) {
        const pos = sunPosition(latitude, longitude, date, h, 9)
        if (pos.altitude > 0) {
          positions.push({ hour: h, altitude: pos.altitude, azimuth: pos.azimuth })
        }
      }
      return {
        label: dateLabel(date),
        color: DATE_COLORS[di % DATE_COLORS.length],
        positions,
      }
    })
  }, [dates, latitude, longitude])

  if (!selectedPointId) {
    return (
      <WorkspacePanelSection
        title="3D 일조 도표"
        icon={<Globe2 size={14} />}
        defaultOpen={false}
      >
        <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
          <Crosshair size={14} className="text-gray-300" />
          측정점을 선택하면 3D 일조 도표를 표시합니다
        </div>
      </WorkspacePanelSection>
    )
  }

  return (
    <WorkspacePanelSection
      title="3D 일조 도표"
      icon={<Globe2 size={14} />}
      defaultOpen={false}
    >
      <div className="space-y-2">
        <ThreeViewer height="280px" className="rounded border border-gray-200">
          <SolarDiagram3D
            sunPaths={sunPaths}
            radius={10}
          />
        </ThreeViewer>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
          {sunPaths.map((p) => (
            <div key={p.label} className="flex items-center gap-1">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {p.label}
            </div>
          ))}
        </div>

        <p className="text-[10px] text-gray-400">
          반구 위 태양 궤적. 회색 영역 = 장애물 차단.
          마우스 드래그로 회전, 스크롤로 확대/축소.
        </p>
      </div>
    </WorkspacePanelSection>
  )
}
