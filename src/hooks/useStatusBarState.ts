import { useMemo } from 'react'
import type { StatusBarState } from '@/components/Workspace/WorkspaceStatusBar'

interface UseStatusBarStateParams {
  phase: string
  error: string | null
}

export function useStatusBarState({ phase, error }: UseStatusBarStateParams): StatusBarState {
  return useMemo((): StatusBarState => {
    if (error) return 'error'
    if (phase === 'uploading') return 'uploading'
    if (phase === 'running' || phase === 'polling') return 'running'
    if (phase === 'completed') return 'completed'
    return 'idle'
  }, [phase, error])
}
