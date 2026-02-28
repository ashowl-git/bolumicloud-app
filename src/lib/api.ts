'use client'

import { useApi } from '@/contexts/ApiContext'
import { logger } from '@/lib/logger'

export class ApiError extends Error {
  status: number
  statusText: string

  constructor(status: number, statusText: string) {
    super(`API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
  }
}

export function useApiClient() {
  const { apiUrl } = useApi()

  const get = async (path: string) => {
    try {
      const res = await fetch(`${apiUrl}${path}`)
      if (!res.ok) throw new ApiError(res.status, res.statusText)
      return res.json()
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error(`GET ${path} failed`, error)
      } else {
        logger.error(`GET ${path} failed`, error instanceof Error ? error : undefined)
      }
      throw error
    }
  }

  const post = async (path: string, body?: unknown) => {
    try {
      const res = await fetch(`${apiUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(body !== undefined && { body: JSON.stringify(body) }),
      })
      if (!res.ok) throw new ApiError(res.status, res.statusText)
      return res.json()
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error(`POST ${path} failed`, error)
      } else {
        logger.error(`POST ${path} failed`, error instanceof Error ? error : undefined)
      }
      throw error
    }
  }

  const postFormData = async (path: string, formData: FormData) => {
    try {
      const res = await fetch(`${apiUrl}${path}`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new ApiError(res.status, res.statusText)
      return res.json()
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error(`POST FormData ${path} failed`, error)
      } else {
        logger.error(`POST FormData ${path} failed`, error instanceof Error ? error : undefined)
      }
      throw error
    }
  }

  const del = async (path: string) => {
    try {
      const res = await fetch(`${apiUrl}${path}`, { method: 'DELETE' })
      if (!res.ok) throw new ApiError(res.status, res.statusText)
      return res.json()
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error(`DELETE ${path} failed`, error)
      } else {
        logger.error(`DELETE ${path} failed`, error instanceof Error ? error : undefined)
      }
      throw error
    }
  }

  const downloadBlob = async (path: string, filename: string, method: 'GET' | 'POST' = 'GET') => {
    try {
      const res = await fetch(`${apiUrl}${path}`, { method })
      if (!res.ok) throw new ApiError(res.status, res.statusText)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error(`Download ${path} failed`, error)
      } else {
        logger.error(`Download ${path} failed`, error instanceof Error ? error : undefined)
      }
      throw error
    }
  }

  const getBlob = async (path: string): Promise<Blob> => {
    try {
      const res = await fetch(`${apiUrl}${path}`)
      if (!res.ok) throw new ApiError(res.status, res.statusText)
      return res.blob()
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error(`GET Blob ${path} failed`, error)
      } else {
        logger.error(`GET Blob ${path} failed`, error instanceof Error ? error : undefined)
      }
      throw error
    }
  }

  const postBlob = async (path: string, body?: unknown): Promise<Blob> => {
    try {
      const res = await fetch(`${apiUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(body !== undefined && { body: JSON.stringify(body) }),
      })
      if (!res.ok) throw new ApiError(res.status, res.statusText)
      return res.blob()
    } catch (error) {
      if (error instanceof ApiError) {
        logger.error(`POST Blob ${path} failed`, error)
      } else {
        logger.error(`POST Blob ${path} failed`, error instanceof Error ? error : undefined)
      }
      throw error
    }
  }

  return { get, post, postFormData, del, downloadBlob, getBlob, postBlob }
}
