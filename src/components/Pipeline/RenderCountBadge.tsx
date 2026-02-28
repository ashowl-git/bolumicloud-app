'use client'

import { MAX_RENDERS } from '@/lib/types/pipeline'

interface RenderCountBadgeProps {
  vfCount: number
  dateCount: number
  hourCount: number
}

export default function RenderCountBadge({ vfCount, dateCount, hourCount }: RenderCountBadgeProps) {
  const total = vfCount * dateCount * hourCount
  const ratio = total / MAX_RENDERS

  let colorClass: string
  if (total === 0) {
    colorClass = 'text-gray-400 border-gray-200'
  } else if (ratio <= 0.5) {
    colorClass = 'text-green-600 border-green-200 bg-green-50'
  } else if (ratio <= 0.8) {
    colorClass = 'text-amber-600 border-amber-200 bg-amber-50'
  } else {
    colorClass = 'text-red-600 border-red-200 bg-red-50'
  }

  return (
    <div className={`border p-4 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          총 렌더 수: {vfCount} VF x {dateCount} dates x {hourCount} hours ={' '}
          <span className="text-lg font-bold">{total}</span>
        </span>
        <span className="text-xs">
          / {MAX_RENDERS} max
        </span>
      </div>
      {total > MAX_RENDERS && (
        <p className="text-xs mt-1">렌더 수가 최대값을 초과합니다. VF, 날짜, 또는 시간을 줄여주세요.</p>
      )}
    </div>
  )
}
