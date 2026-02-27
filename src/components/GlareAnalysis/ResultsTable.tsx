'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { GlareResult } from '@/lib/types/glare'

interface ResultsTableProps {
  results: GlareResult[]
}

export default function ResultsTable({ results }: ResultsTableProps) {
  const [filter, setFilter] = useState<'all' | 'disability' | 'normal'>('all')
  const [sortBy, setSortBy] = useState<keyof GlareResult>('file')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // 필터링
  const filteredResults = results.filter(r => {
    if (filter === 'disability') return r.disability === 1
    if (filter === 'normal') return r.disability === 0
    return true
  })

  // 정렬
  const sortedResults = [...filteredResults].sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }

    return 0
  })

  const handleSort = (column: keyof GlareResult) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const SortIcon = ({ column }: { column: keyof GlareResult }) => {
    if (sortBy !== column) {
      return (
        <span className="text-gray-500 ml-1">
          <svg className="w-3 h-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </span>
      )
    }

    return (
      <span className="text-red-600 ml-1">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  return (
    <div className="border border-gray-200 overflow-hidden">
      {/* 필터 버튼 */}
      <div className="p-6 border-b border-gray-200 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm transition-all duration-300 ${
            filter === 'all'
              ? 'border-b-2 border-red-600 text-gray-900'
              : 'text-gray-800 hover:text-gray-900'
          }`}
        >
          전체 ({results.length})
        </button>

        <button
          onClick={() => setFilter('disability')}
          className={`px-4 py-2 text-sm transition-all duration-300 ${
            filter === 'disability'
              ? 'border-b-2 border-red-600 text-gray-900'
              : 'text-gray-800 hover:text-gray-900'
          }`}
        >
          불능현휘 ({results.filter(r => r.disability === 1).length})
        </button>

        <button
          onClick={() => setFilter('normal')}
          className={`px-4 py-2 text-sm transition-all duration-300 ${
            filter === 'normal'
              ? 'border-b-2 border-red-600 text-gray-900'
              : 'text-gray-800 hover:text-gray-900'
          }`}
        >
          정상 ({results.filter(r => r.disability === 0).length})
        </button>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="p-3 text-left font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('file')}
              >
                파일명 <SortIcon column="file" />
              </th>
              <th
                className="p-3 text-right font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('average')}
              >
                평균 휘도 <SortIcon column="average" />
              </th>
              <th
                className="p-3 text-right font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('max')}
              >
                최대 휘도 <SortIcon column="max" />
              </th>
              <th
                className="p-3 text-right font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('dgp')}
              >
                DGP <SortIcon column="dgp" />
              </th>
              <th
                className="p-3 text-right font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('dgi')}
              >
                DGI <SortIcon column="dgi" />
              </th>
              <th
                className="p-3 text-center font-semibold text-gray-900"
              >
                DGP 등급
              </th>
              <th
                className="p-3 text-center font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('disability')}
              >
                불능현휘 <SortIcon column="disability" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((row, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02, duration: 0.2 }}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="p-3 font-mono text-xs">{row.file}</td>
                <td className="p-3 text-right text-gray-700">{Number(row.average).toFixed(2)}</td>
                <td className="p-3 text-right text-gray-700">{Number(row.max).toFixed(2)}</td>
                <td className="p-3 text-right text-gray-700">{Number(row.dgp).toFixed(3)}</td>
                <td className="p-3 text-right text-gray-700">{Number(row.dgi).toFixed(2)}</td>
                <td className="p-3 text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      row.dgp_rating === '감지못함'
                        ? 'bg-green-100 text-green-800'
                        : row.dgp_rating === '감지'
                        ? 'bg-yellow-100 text-yellow-800'
                        : row.dgp_rating === '방해'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {row.dgp_rating}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {row.disability === 1 ? (
                    <span className="text-red-500 font-bold text-lg">●</span>
                  ) : (
                    <span className="text-green-500 text-lg">-</span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {filteredResults.length === 0 && (
          <div className="text-center text-gray-800 py-8">
            조건에 맞는 데이터가 없습니다
          </div>
        )}
      </div>
    </div>
  )
}
