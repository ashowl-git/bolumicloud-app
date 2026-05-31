'use client'

import Link from 'next/link'
import { Sun, Eye, EyeOff, CheckCircle2, AlertCircle, Clock, ArrowRight, FolderOpen } from 'lucide-react'
import { useProjectList, type ProjectEntry } from '@/hooks/useProjectList'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  title: { ko: '최근 프로젝트', en: 'Recent Projects' } as LocalizedText,
  viewAll: { ko: '전체 보기', en: 'View All' } as LocalizedText,
  empty: { ko: '분석 기록이 없습니다', en: 'No analysis history' } as LocalizedText,
  emptyHint: { ko: '일조/조망/사생활 분석을 실행해 보세요', en: 'Try running a sunlight, view, or privacy analysis' } as LocalizedText,
}

const MODULE_META: Record<string, { icon: typeof Sun; label: string; color: string; href: string }> = {
  sunlight: { icon: Sun, label: '일조', color: 'text-amber-600', href: '/analysis/sunlight' },
  view: { icon: Eye, label: '조망', color: 'text-blue-600', href: '/analysis/view' },
  privacy: { icon: EyeOff, label: '사생활', color: 'text-purple-600', href: '/analysis/privacy' },
}

const STATUS_ICON: Record<string, typeof CheckCircle2> = {
  completed: CheckCircle2,
  error: AlertCircle,
  uploaded: Clock,
  running: Clock,
}

function formatRelativeDate(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function ProjectRow({ project }: { project: ProjectEntry }) {
  const mod = MODULE_META[project.module] || MODULE_META.sunlight
  const ModIcon = mod.icon
  const StatIcon = STATUS_ICON[project.status] || Clock

  return (
    <Link
      href={mod.href}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
    >
      <ModIcon size={16} className={mod.color} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 truncate">
          {project.model_name || '(이름 없음)'}
        </p>
        <p className="text-[11px] text-gray-400">{mod.label} | {formatRelativeDate(project.created_at)}</p>
      </div>
      <StatIcon
        size={14}
        className={project.status === 'completed' ? 'text-emerald-500' : project.status === 'error' ? 'text-red-400' : 'text-gray-300'}
      />
    </Link>
  )
}

export default function RecentProjects() {
  const { t } = useLocalizedText()
  const { projects, isLoading } = useProjectList({ limit: 5 })

  return (
    <div className="border border-gray-200 mb-8 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FolderOpen size={14} className="text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900">{t(txt.title)}</h3>
        </div>
        <Link
          href="/projects"
          className="text-[11px] text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
        >
          {t(txt.viewAll)}
          <ArrowRight size={12} />
        </Link>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-gray-400">...</div>
      ) : projects.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-400">{t(txt.empty)}</p>
          <p className="text-xs text-gray-300 mt-1">{t(txt.emptyHint)}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {projects.map((p) => (
            <ProjectRow key={p.session_id} project={p} />
          ))}
        </div>
      )}
    </div>
  )
}
