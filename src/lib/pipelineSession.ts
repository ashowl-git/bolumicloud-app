const STORAGE_KEY = 'bolumicloud:pipeline-session'

interface PipelineSession {
  sessionId: string
  phase: string
  vfCount: number
}

export function savePipelineSession(sessionId: string, phase: string, vfCount: number): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, phase, vfCount }))
  } catch {
    // sessionStorage unavailable (SSR or private browsing quota exceeded)
  }
}

export function loadPipelineSession(): PipelineSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PipelineSession
    if (!parsed.sessionId || !parsed.phase) return null
    return parsed
  } catch {
    return null
  }
}

export function clearPipelineSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
