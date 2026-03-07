'use client'

import { useState, useEffect, useCallback } from 'react'
import { useApiClient } from '@/lib/api'

export interface ProjectEntry {
  session_id: string
  module: string
  status: string
  progress_pct: number
  model_name: string
  config_summary: {
    latitude: number | null
    longitude: number | null
    month: number | null
    day: number | null
    building_type: string | null
  } | null
  elapsed_sec: number
  has_results: boolean
  created_at: string | null
  updated_at: string | null
}

interface UseProjectListOptions {
  module?: string
  status?: string
  limit?: number
}

export function useProjectList({ module, status, limit = 20 }: UseProjectListOptions = {}) {
  const api = useApiClient()
  const [projects, setProjects] = useState<ProjectEntry[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)

  const fetchProjects = useCallback(async (fetchOffset = 0) => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (module) params.set('module', module)
      if (status) params.set('status', status)
      params.set('limit', String(limit))
      params.set('offset', String(fetchOffset))
      const data = await api.get(`/sessions?${params.toString()}`)
      setProjects(data.sessions)
      setTotal(data.total)
      setOffset(fetchOffset)
    } catch {
      setError('프로젝트 목록을 불러올 수 없습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [api, module, status, limit])

  useEffect(() => {
    fetchProjects(0)
  }, [fetchProjects])

  const nextPage = useCallback(() => {
    if (offset + limit < total) fetchProjects(offset + limit)
  }, [offset, limit, total, fetchProjects])

  const prevPage = useCallback(() => {
    if (offset > 0) fetchProjects(Math.max(0, offset - limit))
  }, [offset, limit, fetchProjects])

  const deleteProject = useCallback(async (sessionId: string) => {
    try {
      await api.del(`/sessions/${sessionId}`)
      setProjects(prev => prev.filter(p => p.session_id !== sessionId))
      setTotal(prev => prev - 1)
    } catch {
      setError('삭제에 실패했습니다.')
    }
  }, [api])

  const refresh = useCallback(() => fetchProjects(offset), [fetchProjects, offset])

  return {
    projects,
    total,
    isLoading,
    error,
    offset,
    limit,
    hasNextPage: offset + limit < total,
    hasPrevPage: offset > 0,
    nextPage,
    prevPage,
    deleteProject,
    refresh,
  }
}
