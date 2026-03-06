'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { X, Grid3X3, Crosshair } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import type { BatchPointParams } from '@/components/Workspace/Sunlight/hooks/usePointGroups'

interface BatchPointCreationDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (params: BatchPointParams) => void
  suggestedBasePoint?: { x: number; y: number; z: number } | null
  suggestedDirection?: { x: number; y: number } | null
}

export default function BatchPointCreationDialog({
  open,
  onClose,
  onConfirm,
  suggestedBasePoint,
  suggestedDirection,
}: BatchPointCreationDialogProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(modalRef, open)

  // ─── 폼 상태 ─────────────────────────────
  const [groupName, setGroupName] = useState('101동')
  const [startFloor, setStartFloor] = useState(2)
  const [endFloor, setEndFloor] = useState(5)
  const [floorHeight, setFloorHeight] = useState(2.8)
  const [unitCount, setUnitCount] = useState(4)
  const [unitSpacing, setUnitSpacing] = useState(8.0)
  const [baseX, setBaseX] = useState(suggestedBasePoint?.x ?? 0)
  const [baseY, setBaseY] = useState(suggestedBasePoint?.y ?? 0)
  const [baseZ, setBaseZ] = useState(suggestedBasePoint?.z ?? 0)
  const [dirX, setDirX] = useState(suggestedDirection?.x ?? 1)
  const [dirY, setDirY] = useState(suggestedDirection?.y ?? 0)

  // suggestedBasePoint / suggestedDirection 변경 시 반영
  // (props가 바뀌면 상태 갱신)
  const prevSuggestedBase = useRef(suggestedBasePoint)
  if (suggestedBasePoint && suggestedBasePoint !== prevSuggestedBase.current) {
    prevSuggestedBase.current = suggestedBasePoint
    setBaseX(suggestedBasePoint.x)
    setBaseY(suggestedBasePoint.y)
    setBaseZ(suggestedBasePoint.z)
  }
  const prevSuggestedDir = useRef(suggestedDirection)
  if (suggestedDirection && suggestedDirection !== prevSuggestedDir.current) {
    prevSuggestedDir.current = suggestedDirection
    setDirX(suggestedDirection.x)
    setDirY(suggestedDirection.y)
  }

  // ─── 계산 ─────────────────────────────
  const floorCount = Math.max(0, endFloor - startFloor + 1)
  const totalPoints = floorCount * unitCount

  const isValid = useMemo(() => {
    return (
      groupName.trim().length > 0 &&
      startFloor >= 1 &&
      endFloor >= startFloor &&
      floorHeight > 0 &&
      unitCount >= 1 &&
      unitSpacing > 0 &&
      totalPoints > 0 &&
      totalPoints <= 10000
    )
  }, [groupName, startFloor, endFloor, floorHeight, unitCount, unitSpacing, totalPoints])

  const handleConfirm = useCallback(() => {
    if (!isValid) return
    // 방향 벡터 정규화
    const mag = Math.sqrt(dirX * dirX + dirY * dirY)
    const normX = mag > 0 ? dirX / mag : 1
    const normY = mag > 0 ? dirY / mag : 0

    onConfirm({
      groupName: groupName.trim(),
      startFloor,
      endFloor,
      floorHeight,
      unitCount,
      unitSpacing,
      basePoint: { x: baseX, y: baseY, z: baseZ },
      direction: { x: normX, y: normY },
    })
    onClose()
  }, [
    isValid, groupName, startFloor, endFloor, floorHeight,
    unitCount, unitSpacing, baseX, baseY, baseZ, dirX, dirY,
    onConfirm, onClose,
  ])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter' && isValid) handleConfirm()
  }, [onClose, isValid, handleConfirm])

  if (!open) return null

  const inputClass = `w-full border border-gray-200 px-2 py-1.5 text-xs tabular-nums
    focus:outline-none focus:border-red-600/30 disabled:opacity-50`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="측정점 일괄 생성"
      onKeyDown={handleKeyDown}
      ref={modalRef}
    >
      <div
        className="bg-white w-full max-w-md mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Grid3X3 size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">측정점 일괄 생성</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-4 py-4 space-y-3">
          {/* 동 이름 */}
          <div>
            <label className="text-[10px] font-medium text-gray-500 block mb-1">
              동 이름 (Group Name)
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="101동"
              className={inputClass}
            />
          </div>

          {/* 시작층 / 끝층 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-gray-500 block mb-1">시작층</label>
              <input
                type="number"
                min={1}
                value={startFloor}
                onChange={(e) => setStartFloor(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-500 block mb-1">끝층</label>
              <input
                type="number"
                min={startFloor}
                value={endFloor}
                onChange={(e) => setEndFloor(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          {/* 층고 */}
          <div>
            <label className="text-[10px] font-medium text-gray-500 block mb-1">층고 (m)</label>
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={floorHeight}
              onChange={(e) => setFloorHeight(Number(e.target.value))}
              className={inputClass}
            />
          </div>

          {/* 호수 / 호 간격 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-gray-500 block mb-1">수평 분할 수</label>
              <input
                type="number"
                min={1}
                value={unitCount}
                onChange={(e) => setUnitCount(Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-500 block mb-1">수평 간격 (m)</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={unitSpacing}
                onChange={(e) => setUnitSpacing(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          {/* 기준점 */}
          <div>
            <label className="text-[10px] font-medium text-gray-500 block mb-1">
              기준점 (그리드 좌측 하단)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">X</label>
                <input
                  type="number"
                  step={0.1}
                  value={baseX}
                  onChange={(e) => setBaseX(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">Y</label>
                <input
                  type="number"
                  step={0.1}
                  value={baseY}
                  onChange={(e) => setBaseY(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">Z</label>
                <input
                  type="number"
                  step={0.1}
                  value={baseZ}
                  onChange={(e) => setBaseZ(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
            {suggestedBasePoint && (
              <button
                onClick={() => {
                  setBaseX(suggestedBasePoint.x)
                  setBaseY(suggestedBasePoint.y)
                  setBaseZ(suggestedBasePoint.z)
                }}
                className="flex items-center gap-1 mt-1 text-[10px] text-red-600 hover:text-red-700"
              >
                <Crosshair size={10} />
                3D 뷰에서 선택한 점 적용
              </button>
            )}
          </div>

          {/* 입면 방향 */}
          <div>
            <label className="text-[10px] font-medium text-gray-500 block mb-1">
              그리드 수평 방향
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">X</label>
                <input
                  type="number"
                  step={0.1}
                  value={dirX}
                  onChange={(e) => setDirX(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-0.5">Y</label>
                <input
                  type="number"
                  step={0.1}
                  value={dirY}
                  onChange={(e) => setDirY(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* 그리드 배치 가이드 + 미리보기 요약 */}
          <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
            <div className="flex items-start gap-3 mb-1.5">
              <pre className="text-[9px] leading-tight text-gray-400 font-mono whitespace-pre select-none">{
`       수평 방향 →
  ┌──┬──┬──┬──┐ ${endFloor}층
  │  │  │  │  │
  ├──┼──┼──┼──┤
★ │  │  │  │  │ ${startFloor}층
  └──┴──┴──┴──┘
★ 기준점(좌측 하단)`
              }</pre>
            </div>
            <p className="text-xs text-gray-700">
              <span className="font-medium">{floorCount}층</span>
              {' x '}
              <span className="font-medium">{unitCount}열</span>
              {' = '}
              <span className="font-semibold text-red-600">{totalPoints}개</span>
              {' 측정점 생성'}
            </p>
            {totalPoints > 1000 && (
              <p className="text-[10px] text-amber-600 mt-0.5">
                측정점이 많으면 분석 시간이 증가합니다
              </p>
            )}
            {totalPoints > 10000 && (
              <p className="text-[10px] text-red-500 mt-0.5">
                최대 10,000개까지 생성 가능합니다
              </p>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-3">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-gray-600 border border-gray-200
              hover:border-gray-400 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className="px-4 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700
              transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            생성
          </button>
        </div>
      </div>
    </div>
  )
}
