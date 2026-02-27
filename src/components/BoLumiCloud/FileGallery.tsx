'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { GlareResult } from '@/lib/types/glare'

interface FileGalleryProps {
  results: GlareResult[]
  onFileSelect: (filename: string) => void
  selectedFile: string
}

export default function FileGallery({ results, onFileSelect, selectedFile }: FileGalleryProps) {
  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [filterTimeRange, setFilterTimeRange] = useState<[number, number]>([8, 17])
  const [filterViewpoint, setFilterViewpoint] = useState<string>('all')

  // 고유 값 추출
  const uniqueMonths = useMemo(() =>
    Array.from(new Set(results.map(r => r.month).filter(Boolean))).sort(),
    [results]
  )
  const uniqueViewpoints = useMemo(() =>
    Array.from(new Set(results.map(r => r.viewp).filter(Boolean))).sort(),
    [results]
  )

  // 필터링
  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const monthMatch = filterMonth === 'all' || r.month === filterMonth
      const timeNum = parseInt(r.time || '0')
      const timeMatch = timeNum >= filterTimeRange[0] && timeNum <= filterTimeRange[1]
      const viewMatch = filterViewpoint === 'all' || r.viewp === filterViewpoint

      return monthMatch && timeMatch && viewMatch
    })
  }, [results, filterMonth, filterTimeRange, filterViewpoint])

  return (
    <div className="space-y-6">
      {/* 필터 패널 */}
      <div className="border border-gray-200 p-6">
        <h4 className="text-base font-medium text-gray-900 mb-4">
          파일 필터 ({filteredResults.length}/{results.length}개)
        </h4>

        <div className="grid md:grid-cols-4 gap-4">
          {/* 월 필터 */}
          <div>
            <label className="text-sm text-gray-800 mb-2 block">절기</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full border border-gray-200 p-2 text-sm"
            >
              <option value="all">전체</option>
              {uniqueMonths.map((month) => (
                <option key={month} value={month}>
                  {month === 'Dec' ? '동지 (12월)' :
                   month === 'Mar' ? '춘추분 (3월)' :
                   month === 'Jun' ? '하지 (6월)' : month}
                </option>
              ))}
            </select>
          </div>

          {/* 시간 범위 */}
          <div>
            <label className="text-sm text-gray-800 mb-2 block">
              시간 범위 ({filterTimeRange[0]}~{filterTimeRange[1]}시)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="8"
                max="17"
                value={filterTimeRange[0]}
                onChange={(e) => setFilterTimeRange([Number(e.target.value), filterTimeRange[1]])}
                className="flex-1"
              />
              <input
                type="range"
                min="8"
                max="17"
                value={filterTimeRange[1]}
                onChange={(e) => setFilterTimeRange([filterTimeRange[0], Number(e.target.value)])}
                className="flex-1"
              />
            </div>
          </div>

          {/* 뷰포인트 */}
          <div>
            <label className="text-sm text-gray-800 mb-2 block">뷰포인트</label>
            <select
              value={filterViewpoint}
              onChange={(e) => setFilterViewpoint(e.target.value)}
              className="w-full border border-gray-200 p-2 text-sm"
            >
              <option value="all">전체</option>
              {uniqueViewpoints.map((vp) => (
                <option key={vp} value={vp}>
                  Camera {vp}
                </option>
              ))}
            </select>
          </div>

          {/* 초기화 */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterMonth('all')
                setFilterTimeRange([8, 17])
                setFilterViewpoint('all')
              }}
              className="w-full border border-gray-200 hover:border-red-600/30 p-2 text-sm
                transition-colors"
            >
              필터 초기화
            </button>
          </div>
        </div>
      </div>

      {/* 썸네일 갤러리 */}
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {filteredResults.map((result, i) => (
          <motion.button
            key={result.file}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02, duration: 0.2 }}
            onClick={() => onFileSelect(result.file)}
            className={`border-2 p-3 text-center transition-all ${
              selectedFile === result.file
                ? 'border-red-600 bg-red-50'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <div className="text-xs font-mono text-gray-900 mb-2">
              {result.file.replace('.pic', '')}
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-800">
                DGP: {result.dgp.toFixed(2)}
              </div>

              {result.disability === 1 && (
                <div className="text-xs text-red-600 font-medium">
                  ⚠ 불능
                </div>
              )}

              {result.disability === 0 && (
                <div className="text-xs text-green-600">
                  ✓
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {filteredResults.length === 0 && (
        <div className="text-center py-12 text-gray-800">
          필터 조건에 맞는 파일이 없습니다
        </div>
      )}
    </div>
  )
}
