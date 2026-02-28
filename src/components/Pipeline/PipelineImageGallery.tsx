'use client'

import { useState, useMemo } from 'react'
import type { GlareResult } from '@/lib/types/glare'

interface PipelineImageGalleryProps {
  results: GlareResult[]
  apiUrl: string
  sessionId: string
  onImageClick: (result: GlareResult) => void
}

export default function PipelineImageGallery({
  results,
  apiUrl,
  sessionId,
  onImageClick,
}: PipelineImageGalleryProps) {
  const [filterViewpoint, setFilterViewpoint] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<string>('all')
  const [filterHour, setFilterHour] = useState<string>('all')
  const [filterRating, setFilterRating] = useState<string>('all')

  // Extract unique filter values
  const viewpoints = useMemo(
    () => Array.from(new Set(results.map(r => r.viewp).filter(Boolean))).sort(),
    [results]
  )
  const dateLabels = useMemo(
    () => Array.from(new Set(results.map(r => r.date_label).filter(Boolean))).sort(),
    [results]
  )
  const hours = useMemo(
    () => Array.from(new Set(results.map(r => r.time).filter(Boolean))).sort(),
    [results]
  )
  const ratings = ['감지못함', '감지', '방해', '견딜수없음']

  // Apply filters
  const filtered = useMemo(() => {
    return results.filter(r => {
      if (filterViewpoint !== 'all' && r.viewp !== filterViewpoint) return false
      if (filterDate !== 'all' && r.date_label !== filterDate) return false
      if (filterHour !== 'all' && r.time !== filterHour) return false
      if (filterRating !== 'all' && r.dgp_rating !== filterRating) return false
      return true
    })
  }, [results, filterViewpoint, filterDate, filterHour, filterRating])

  const ratingColor = (rating: string) => {
    switch (rating) {
      case '감지못함': return 'bg-green-100 text-green-800'
      case '감지': return 'bg-yellow-100 text-yellow-800'
      case '방해': return 'bg-orange-100 text-orange-800'
      case '견딜수없음': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="border border-gray-200 p-6 space-y-4">
      <h3 className="text-sm font-medium text-gray-900">이미지 갤러리</h3>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {viewpoints.length > 1 && (
          <select
            value={filterViewpoint}
            onChange={(e) => setFilterViewpoint(e.target.value)}
            className="border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400"
          >
            <option value="all">모든 뷰포인트</option>
            {viewpoints.map(vp => (
              <option key={vp} value={vp}>{vp}</option>
            ))}
          </select>
        )}

        {dateLabels.length > 1 && (
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400"
          >
            <option value="all">모든 날짜</option>
            {dateLabels.map(dl => (
              <option key={dl} value={dl}>{dl}</option>
            ))}
          </select>
        )}

        {hours.length > 1 && (
          <select
            value={filterHour}
            onChange={(e) => setFilterHour(e.target.value)}
            className="border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400"
          >
            <option value="all">모든 시간</option>
            {hours.map(h => (
              <option key={h} value={h}>{h}시</option>
            ))}
          </select>
        )}

        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value)}
          className="border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-400"
        >
          <option value="all">모든 등급</option>
          {ratings.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <span className="text-xs text-gray-500 self-center">
          {filtered.length} / {results.length}
        </span>
      </div>

      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((result) => (
          <button
            key={result.file}
            type="button"
            onClick={() => onImageClick(result)}
            className="group border border-gray-200 hover:border-red-600/30
              transition-all duration-300 overflow-hidden text-left"
          >
            {/* Thumbnail */}
            <div className="aspect-video bg-gray-100 relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${apiUrl}/pipeline/preview/${sessionId}/${result.file}`}
                alt={result.file}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              {/* DGP badge */}
              <span
                className={`absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-semibold ${ratingColor(result.dgp_rating)}`}
              >
                {Number(result.dgp).toFixed(2)}
              </span>
            </div>

            {/* Info */}
            <div className="p-2">
              <p className="text-[10px] text-gray-500 truncate font-mono">{result.file}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {result.viewp && (
                  <span className="text-[10px] text-gray-400">{result.viewp}</span>
                )}
                {result.date_label && (
                  <span className="text-[10px] text-gray-400">| {result.date_label}</span>
                )}
                {result.time && (
                  <span className="text-[10px] text-gray-400">| {result.time}시</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-gray-800 py-8 text-sm">
          필터 조건에 맞는 이미지가 없습니다
        </div>
      )}
    </div>
  )
}
