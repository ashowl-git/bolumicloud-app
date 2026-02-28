'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { logger } from '@/lib/logger'
import { useApiClient } from '@/lib/api'
import { useApi } from '@/contexts/ApiContext'
import { useToast } from '@/contexts/ToastContext'

interface DaylightResult {
  stats: {
    mean: number
    max: number
    min: number
    std: number
  }
  grid_size: number
  grid_count: number
  csv_data: string
  heatmap: string
  note?: string
}

export default function DaylightAnalysis() {
  const api = useApiClient()
  const { apiUrl } = useApi()
  const { showToast } = useToast()
  const [files, setFiles] = useState<string[]>([])
  const [sceneFile, setSceneFile] = useState('')
  const [gridSize, setGridSize] = useState<number>(0.5)
  const [roomWidth, setRoomWidth] = useState<number>(5.0)
  const [roomDepth, setRoomDepth] = useState<number>(4.0)
  const [roomHeight, setRoomHeight] = useState<number>(2.7)
  const [result, setResult] = useState<DaylightResult | null>(null)
  const [loading, setLoading] = useState(false)

  // 파일 목록 로드
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const data = await api.get('/files')
        const radFiles = data.files.filter((f: string) =>
          /\.(rad|oct)$/i.test(f)
        )
        setFiles(radFiles)
      } catch (e) {
        logger.error('Failed to load files', e instanceof Error ? e : undefined)
        showToast({ type: 'error', message: '파일 목록을 불러오지 못하였습니다' })
      }
    }

    loadFiles()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl])

  const handleAnalyze = async () => {
    if (!sceneFile) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        scene_file: sceneFile,
        grid_size: gridSize.toString(),
        room_width: roomWidth.toString(),
        room_depth: roomDepth.toString(),
        room_height: roomHeight.toString()
      })

      const path = `/analyze/daylight?${params.toString()}`
      const data = await api.post(path)
      setResult(data)
    } catch (e) {
      logger.error('Daylight analysis error', e instanceof Error ? e : undefined)
      showToast({ type: 'error', message: '일조 분석 중 오류가 발생하였습니다' })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCSV = () => {
    if (result?.csv_data) {
      const blob = new Blob([result.csv_data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `daylight_analysis_${Date.now()}.csv`
      link.click()
    }
  }

  const handleDownloadImage = () => {
    if (result?.heatmap) {
      const byteString = result.heatmap.match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join('') || ''
      const blob = new Blob([byteString], { type: 'image/png' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `daylight_heatmap_${Date.now()}.png`
      link.click()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-normal text-gray-900 mb-4">일조 확인</h2>
        <p className="text-sm text-gray-800 mb-6">
          Radiance rtrace를 사용한 Daylight Factor 분석
        </p>

        <div className="border border-gray-200 p-6 space-y-4">
          {/* 씬 파일 선택 */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              씬 파일 (필수)
            </label>
            <select
              value={sceneFile}
              onChange={(e) => setSceneFile(e.target.value)}
              className="w-full border border-gray-200 px-4 py-2 focus:outline-none focus:border-red-600/30 transition-colors"
            >
              <option value="">씬 파일을 선택하세요 (.rad, .oct)</option>
              {files.map((file) => (
                <option key={file} value={file}>
                  {file}
                </option>
              ))}
            </select>
          </div>

          {/* 공간 크기 */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">폭 (m)</label>
              <input
                type="number"
                value={roomWidth}
                onChange={(e) => setRoomWidth(parseFloat(e.target.value))}
                step={0.1}
                min={1}
                max={20}
                className="w-full border border-gray-200 px-4 py-2 focus:outline-none focus:border-red-600/30"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">깊이 (m)</label>
              <input
                type="number"
                value={roomDepth}
                onChange={(e) => setRoomDepth(parseFloat(e.target.value))}
                step={0.1}
                min={1}
                max={20}
                className="w-full border border-gray-200 px-4 py-2 focus:outline-none focus:border-red-600/30"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">높이 (m)</label>
              <input
                type="number"
                value={roomHeight}
                onChange={(e) => setRoomHeight(parseFloat(e.target.value))}
                step={0.1}
                min={2}
                max={5}
                className="w-full border border-gray-200 px-4 py-2 focus:outline-none focus:border-red-600/30"
              />
            </div>
          </div>

          {/* 그리드 크기 */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              그리드 크기: {gridSize}m
            </label>
            <input
              type="range"
              value={gridSize}
              onChange={(e) => setGridSize(parseFloat(e.target.value))}
              min={0.1}
              max={2.0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-800 mt-1">
              <span>0.1m (정밀)</span>
              <span>2.0m (빠름)</span>
            </div>
          </div>

          {/* 분석 버튼 */}
          <button
            onClick={handleAnalyze}
            disabled={!sceneFile || loading}
            className="w-full border border-gray-200 hover:border-red-600/30 px-6 py-3
              text-gray-900 hover:text-red-600 transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '분석 중...' : '일조 분석 시작'}
          </button>
        </div>
      </div>

      {/* 결과 */}
      {result && (
        <div className="space-y-6">
          {/* 통계 */}
          <div className="border border-gray-200 p-6">
            <h3 className="text-lg font-normal text-gray-900 mb-4">통계</h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-800 mb-1">평균 DF</p>
                <p className="text-2xl font-normal text-gray-900">
                  {result.stats.mean}%
                </p>
              </div>
              <div>
                <p className="text-gray-800 mb-1">최대 DF</p>
                <p className="text-2xl font-normal text-gray-900">
                  {result.stats.max}%
                </p>
              </div>
              <div>
                <p className="text-gray-800 mb-1">최소 DF</p>
                <p className="text-2xl font-normal text-gray-900">
                  {result.stats.min}%
                </p>
              </div>
              <div>
                <p className="text-gray-800 mb-1">표준편차</p>
                <p className="text-2xl font-normal text-gray-900">
                  {result.stats.std}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-700 mt-4">
              그리드 포인트: {result.grid_count}개 (크기: {result.grid_size}m)
            </p>
          </div>

          {/* 히트맵 */}
          <div className="border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-normal text-gray-900">히트맵</h3>
              <button
                onClick={handleDownloadImage}
                className="px-4 py-2 text-xs border border-gray-200 hover:border-red-600/30 transition-colors"
              >
                이미지 다운로드
              </button>
            </div>

            <div className="border border-gray-200 p-4 bg-amber-50/50 relative min-h-[200px]">
              <Image
                src={`data:image/png;base64,${btoa(result.heatmap.match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join('') || '')}`}
                alt="Daylight heatmap"
                fill
                className="object-contain"
                style={{ imageRendering: 'pixelated' }}
                unoptimized
              />
            </div>

            <div className="flex justify-between text-xs text-gray-800 mt-2">
              <span>Low DF (파랑)</span>
              <span>High DF (빨강)</span>
            </div>
          </div>

          {/* CSV 다운로드 */}
          <div className="border border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-normal text-gray-900 mb-1">데이터</h3>
                <p className="text-xs text-gray-800">
                  X, Y, Z 좌표 및 Daylight Factor 값
                </p>
              </div>
              <button
                onClick={handleDownloadCSV}
                className="px-4 py-2 text-xs border border-gray-200 hover:border-red-600/30 transition-colors"
              >
                CSV 다운로드
              </button>
            </div>
          </div>

          {/* 프로토타입 안내 */}
          {result.note && (
            <div className="border border-gray-200 p-4 bg-amber-50/50 text-xs text-gray-800">
              <p className="font-medium text-amber-900 mb-1">개발 중 기능</p>
              <p>{result.note}</p>
            </div>
          )}
        </div>
      )}

      <div className="border border-gray-200 p-6 text-sm text-gray-800">
        <h4 className="font-medium text-gray-900 mb-2">Daylight Factor란?</h4>
        <p>실내 특정 지점의 조도를 실외 전천공 조도로 나눈 값입니다.</p>
        <p className="mt-2">DF = (실내 조도 / 실외 조도) × 100%</p>
        <p className="mt-2 text-xs text-gray-800">
          권장값: 거실 2%, 침실 1%, 주방 3%, 작업공간 5%
        </p>
      </div>
    </motion.div>
  )
}
