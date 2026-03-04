'use client'

import { useState } from 'react'
import { List, FolderPlus, Grid3X3, ArrowUpDown, ArrowRightLeft, X, Crosshair } from 'lucide-react'
import type { MeasurementPointGroup } from '@/lib/types/sunlight'
import type { BaseAnalysisPoint } from '@/components/shared/3d/interaction/types'
import type { BatchPointParams } from '@/components/Workspace/Sunlight/hooks/usePointGroups'
import BatchPointCreationDialog from './BatchPointCreationDialog'

import WorkspacePanelSection from '../Workspace/WorkspacePanelSection'

interface PointGroupManagerProps {
  points: BaseAnalysisPoint[]
  selectedPointId?: string | null
  onPointSelect?: (id: string) => void
  groups: MeasurementPointGroup[]
  activeGroupId: string | null
  onAddGroup: (name: string) => void
  onRemoveGroup: (groupId: string) => void
  onRenameGroup: (groupId: string, name: string) => void
  onSetActiveGroup: (groupId: string) => void
  onSortGroup: (groupId: string) => void
  onToggleReverseColumns: (groupId: string) => void
  onBatchCreate?: (params: BatchPointParams) => void
  disabled?: boolean
}

export default function PointGroupManager({
  points,
  selectedPointId,
  onPointSelect,
  groups,
  activeGroupId,
  onAddGroup,
  onRemoveGroup,
  onRenameGroup,
  onSetActiveGroup,
  onSortGroup,
  onToggleReverseColumns,
  onBatchCreate,
  disabled,
}: PointGroupManagerProps) {
  const [showBatchDialog, setShowBatchDialog] = useState(false)

  return (
    <>
    <BatchPointCreationDialog
      open={showBatchDialog}
      onClose={() => setShowBatchDialog(false)}
      onConfirm={(params) => onBatchCreate?.(params)}
    />
    <WorkspacePanelSection
      title="측정점 그룹"
      icon={<List size={14} />}
      badge={points.length}
      defaultOpen={true}
    >
      {/* 그룹 탭 */}
      <div className="flex items-center gap-1 mb-2 overflow-x-auto">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => onSetActiveGroup(g.id)}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-full
              whitespace-nowrap transition-all ${
              activeGroupId === g.id
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {g.name}
            <span className="text-[10px] opacity-70">{g.points.length}</span>
          </button>
        ))}
        <button
          onClick={() => {
            const name = `${groups.length + 1}동`
            onAddGroup(name)
          }}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="그룹 추가"
        >
          <FolderPlus size={14} />
        </button>
        {onBatchCreate && (
          <button
            onClick={() => setShowBatchDialog(true)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="측정점 일괄 생성"
            disabled={disabled}
          >
            <Grid3X3 size={14} />
          </button>
        )}
      </div>

      {/* 활성 그룹 컨트롤 */}
      {activeGroupId && (() => {
        const activeGroup = groups.find((g) => g.id === activeGroupId)
        if (!activeGroup) return null

        return (
          <div className="space-y-2">
            {/* 그룹명 편집 + 정렬 버튼 */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={activeGroup.name}
                onChange={(e) => onRenameGroup(activeGroup.id, e.target.value)}
                className="flex-1 border border-gray-200 px-2 py-1 text-xs
                  focus:outline-none focus:border-red-600/30"
                disabled={disabled}
              />
              <button
                onClick={() => onSortGroup(activeGroup.id)}
                className="p-1.5 border border-gray-200 text-gray-500 hover:text-red-600
                  hover:border-red-600/30 transition-colors"
                title="행/열 자동 정렬"
              >
                <ArrowUpDown size={12} />
              </button>
              <button
                onClick={() => onToggleReverseColumns(activeGroup.id)}
                className={`p-1.5 border transition-colors ${
                  activeGroup.reverseColumns
                    ? 'border-red-600 text-red-600 bg-red-50'
                    : 'border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-600/30'
                }`}
                title="열 순서 반전"
              >
                <ArrowRightLeft size={12} />
              </button>
              {groups.length > 1 && (
                <button
                  onClick={() => onRemoveGroup(activeGroup.id)}
                  className="p-1.5 border border-gray-200 text-gray-400 hover:text-red-500
                    hover:border-red-300 transition-colors"
                  title="그룹 삭제"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* 포인트 리스트 (행/열 표시) */}
            {activeGroup.points.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-3 text-center">
                <Crosshair size={18} className="text-gray-300" />
                <p className="text-xs text-gray-400">
                  3D 뷰에서 지면/건물을 클릭하여<br />측정점을 배치하세요
                </p>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                {/* 헤더 */}
                {activeGroup.sorted && (
                  <div className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-400
                    border-b border-gray-100 sticky top-0 bg-white">
                    <span className="w-8 text-center">행</span>
                    <span className="w-8 text-center">열</span>
                    <span className="flex-1">이름</span>
                    <span className="text-right">좌표</span>
                  </div>
                )}
                {/* 포인트 목록 */}
                <div className="space-y-0.5">
                  {activeGroup.points.map((pt) => {
                    const isSelected = selectedPointId === pt.id
                    return (
                      <button
                        key={pt.id}
                        onClick={() => onPointSelect?.(pt.id)}
                        className={`w-full flex items-center gap-1 text-left px-2 py-1 text-xs
                          rounded transition-colors ${
                          isSelected
                            ? 'bg-red-50 text-red-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {activeGroup.sorted && (
                          <>
                            <span className="w-8 text-center tabular-nums text-[10px]">{pt.row}</span>
                            <span className="w-8 text-center tabular-nums text-[10px]">{pt.column}</span>
                          </>
                        )}
                        <span className="flex-1 truncate">{pt.name}</span>
                        <span className={`text-[10px] tabular-nums ${
                          isSelected ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {pt.x.toFixed(1)}, {pt.y.toFixed(1)}, {pt.z.toFixed(1)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })()}
    </WorkspacePanelSection>
    </>
  )
}
