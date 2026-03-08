'use client'

import { useApi } from '@/contexts/ApiContext'
import { logger } from '@/lib/logger'

const STATUS_MESSAGES: Record<number, string> = {
  400: '요청이 올바르지 않습니다.',
  401: '인증이 필요합니다.',
  403: '접근 권한이 없습니다.',
  404: '요청한 리소스를 찾을 수 없습니다.',
  409: '이미 처리 중인 요청이 있습니다.',
  410: '세션이 만료되었습니다.',
  413: '파일 크기가 제한을 초과하였습니다.',
  422: '입력값을 확인해주세요.',
  429: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
  500: '서버 오류가 발생하였습니다. 잠시 후 다시 시도하세요.',
  502: '서버에 연결할 수 없습니다.',
  503: '서비스 점검 중입니다.',
}

export class ApiError extends Error {
  status: number
  statusText: string
  errorCode: string | null
  userMessage: string
  recoveryHint: string | null

  constructor(status: number, statusText: string, body?: { error?: string; message?: string; detail?: string }, retryAfter?: number) {
    super(`API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.errorCode = body?.error ?? null
    this.userMessage = ApiError.buildUserMessage(status, body, retryAfter)
    this.recoveryHint = ApiError.buildRecoveryHint(status)
  }

  private static buildUserMessage(
    status: number,
    body?: { error?: string; message?: string; detail?: string },
    retryAfter?: number,
  ): string {
    if (status === 429) {
      const wait = retryAfter ? `${retryAfter}초 후` : '잠시 후'
      return `요청이 너무 많습니다. ${wait} 다시 시도해주세요.`
    }
    return body?.message || body?.detail || body?.error || STATUS_MESSAGES[status] || `서버 오류가 발생하였습니다 (${status})`
  }

  private static buildRecoveryHint(status: number): string | null {
    if (status === 401 || status === 403) return '다시 로그인해주세요.'
    if (status === 413) return '파일 크기를 줄여 다시 시도해주세요.'
    if (status === 429 || status >= 500) return '잠시 후 다시 시도해주세요.'
    return null
  }
}

export function buildUserMessage(error: unknown): string {
  if (error instanceof ApiError) return error.userMessage
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return '네트워크 연결을 확인해주세요.'
  }
  if (error instanceof Error) return error.message
  return '알 수 없는 오류가 발생하였습니다.'
}

async function parseErrorBody(res: Response): Promise<ApiError> {
  let body: { error?: string; message?: string; detail?: string } | undefined
  try {
    body = await res.json()
  } catch { /* non-JSON response */ }
  const retryAfter = res.status === 429 ? parseInt(res.headers.get('Retry-After') || '', 10) || undefined : undefined
  return new ApiError(res.status, res.statusText, body, retryAfter)
}

// ─── 공통 에러 로깅 + 재던지기 ─────────────────────

function logAndThrow(label: string, error: unknown): never {
  if (error instanceof ApiError) {
    logger.error(`${label} failed`, error)
  } else {
    logger.error(`${label} failed`, error instanceof Error ? error : undefined)
  }
  throw error
}

async function wrapRequest<T>(
  label: string,
  fetchFn: () => Promise<Response>,
  transform: (res: Response) => Promise<T>,
): Promise<T> {
  try {
    const res = await fetchFn()
    if (!res.ok) throw await parseErrorBody(res)
    return transform(res)
  } catch (error) {
    logAndThrow(label, error)
  }
}

export function useApiClient() {
  const { apiUrl } = useApi()

  const get = (path: string) =>
    wrapRequest(`GET ${path}`, () => fetch(`${apiUrl}${path}`), (r) => r.json())

  const post = (path: string, body?: unknown) =>
    wrapRequest(
      `POST ${path}`,
      () => fetch(`${apiUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(body !== undefined && { body: JSON.stringify(body) }),
      }),
      (r) => r.json(),
    )

  const postFormData = async (
    path: string,
    formData: FormData,
    options?: { onProgress?: (percent: number) => void },
  ) => {
    // Use XMLHttpRequest for upload progress tracking when callback provided
    if (options?.onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${apiUrl}${path}`)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            options.onProgress!(Math.round((e.loaded / e.total) * 100))
          }
        }
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText)
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data)
            } else {
              const err = new ApiError(xhr.status, xhr.statusText, data)
              logger.error(`POST FormData ${path} failed`, err)
              reject(err)
            }
          } catch {
            reject(new ApiError(xhr.status, xhr.statusText))
          }
        }
        xhr.onerror = () => {
          reject(new TypeError('Failed to fetch'))
        }
        xhr.send(formData)
      })
    }

    return wrapRequest(
      `POST FormData ${path}`,
      () => fetch(`${apiUrl}${path}`, { method: 'POST', body: formData }),
      (r) => r.json(),
    )
  }

  const del = (path: string) =>
    wrapRequest(
      `DELETE ${path}`,
      () => fetch(`${apiUrl}${path}`, { method: 'DELETE' }),
      (r) => r.json(),
    )

  const downloadBlob = async (path: string, filename: string, method: 'GET' | 'POST' = 'GET') => {
    const blob = await wrapRequest(
      `Download ${path}`,
      () => fetch(`${apiUrl}${path}`, { method }),
      (r) => r.blob(),
    )
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getBlob = (path: string): Promise<Blob> =>
    wrapRequest(`GET Blob ${path}`, () => fetch(`${apiUrl}${path}`), (r) => r.blob())

  const postBlob = (path: string, body?: unknown): Promise<Blob> =>
    wrapRequest(
      `POST Blob ${path}`,
      () => fetch(`${apiUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(body !== undefined && { body: JSON.stringify(body) }),
      }),
      (r) => r.blob(),
    )

  return { get, post, postFormData, del, downloadBlob, getBlob, postBlob }
}
