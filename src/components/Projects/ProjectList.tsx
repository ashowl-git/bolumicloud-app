'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sun, Eye, EyeOff, Clock, CheckCircle2, AlertCircle,
  Loader2, Trash2, ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react'
import { useProjectList, type ProjectEntry } from '@/hooks/useProjectList'

const MODULE_META: Record<string, { icon: typeof Sun; label: string; color: string; href: string }> = {
  sunlight: { icon: Sun, label: '일조 분석', color: 'text-amber-600 bg-amber-50', href: '/analysis/sunlight' },
  view: { icon: Eye, label: '조망 분석', color: 'text-blue-600 bg-blue-50', href: '/analysis/view' },
  privacy: { icon: EyeOff, label: '사생활 분석', color: 'text-purple-600 bg-purple-50', href: '/analysis/privacy' },
}

const STATUS_META: Record<string, { icon: typeof CheckCircle2; label: string; color: string }> = {
  uploaded: { icon: Clock, label: '대기', color: 'text-gray-500' },
  running: { icon: Loader2, label: '진행 중', color: 'text-blue-600' },
  completed: { icon: CheckCircle2, label: '완료', color: 'text-emerald-600' },
  error: { icon: AlertCircle, label: '오류', color: 'text-red-500' },
}

function formatDate(iso: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatElapsed(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}초`
  if (sec < 3600) return `${Math.round(sec / 60)}분`
  return `${(sec / 3600).toFixed(1)}시간`
}

function ProjectCard({ project, onDelete }: { project: ProjectEntry; onDelete: () => void }) {
  const mod = MODULE_META[project.module] || MODULE_META.sunlight
  const stat = STATUS_META[project.status] || STATUS_META.uploaded
  const ModIcon = mod.icon
  const StatIcon = stat.icon
  const [confirmDelete, setConfirmDelete] = useState(false)

  const configStr = project.config_summary
    ? [
        project.config_summary.month && project.config_summary.day
          ? `${project.config_summary.month}/${project.config_summary.day}`
          : null,
        project.config_summary.building_type,
      ].filter(Boolean).join(' | ')
    : null

  return (
    <div className="group border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        {/* Module icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${mod.color}`}>
          <ModIcon size={18} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {project.model_name || '(이름 없음)'}
            </h3>
            <span className={`flex items-center gap-1 text-[11px] font-medium ${stat.color}`}>
              <StatIcon size={12} className={project.status === 'running' ? 'animate-spin' : ''} />
              {stat.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
            <span>{mod.label}</span>
            {configStr && <span>{configStr}</span>}
            {project.elapsed_sec > 0 && <span>{formatElapsed(project.elapsed_sec)}</span>}
            <span>{formatDate(project.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {project.has_results && (
            <Link
              href={mod.href}
              className="px-3 py-1.5 text-[11px] font-medium text-blue-600 bg-blue-50
                hover:bg-blue-100 rounded-md transition-colors"
            >
              결과 보기
            </Link>
          )}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onDelete}
                className="px-2 py-1 text-[11px] text-red-600 bg-red-50 hover:bg-red-100
                  rounded transition-colors font-medium"
              >
                확인
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-[11px] text-gray-500 hover:text-gray-700
                  rounded transition-colors"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100
                transition-all rounded"
              title="삭제"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProjectList() {
  const [moduleFilter, setModuleFilter] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const {
    projects,
    total,
    isLoading,
    error,
    offset,
    limit,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    deleteProject,
    refresh,
  } = useProjectList({ module: moduleFilter, status: statusFilter })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterPill
          label="전체"
          active={!moduleFilter}
          onClick={() => setModuleFilter(undefined)}
        />
        {Object.entries(MODULE_META).map(([key, meta]) => (
          <FilterPill
            key={key}
            label={meta.label}
            active={moduleFilter === key}
            onClick={() => setModuleFilter(moduleFilter === key ? undefined : key)}
          />
        ))}
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <FilterPill
          label="완료"
          active={statusFilter === 'completed'}
          onClick={() => setStatusFilter(statusFilter === 'completed' ? undefined : 'completed')}
        />
        <FilterPill
          label="오류"
          active={statusFilter === 'error'}
          onClick={() => setStatusFilter(statusFilter === 'error' ? undefined : 'error')}
        />
        <button
          onClick={refresh}
          className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded"
          title="새로고침"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={20} className="animate-spin mr-2" />
          불러오는 중...
        </div>
      ) : error ? (
        <div className="text-center py-20 text-gray-400">
          <AlertCircle size={24} className="mx-auto mb-2 text-red-400" />
          <p className="text-sm">{error}</p>
          <button onClick={refresh} className="mt-2 text-xs text-blue-500 hover:underline">
            다시 시도
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">분석 기록이 없습니다.</p>
          <p className="text-xs mt-1">일조/조망/사생활 분석을 실행하면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <ProjectCard
              key={p.session_id}
              project={p}
              onDelete={() => deleteProject(p.session_id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-400">
            {offset + 1}-{Math.min(offset + limit, total)} / {total}건
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={prevPage}
              disabled={!hasPrevPage}
              className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors rounded"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextPage}
              disabled={!hasNextPage}
              className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors rounded"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-full border transition-colors
        ${active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
        }`}
    >
      {label}
    </button>
  )
}
