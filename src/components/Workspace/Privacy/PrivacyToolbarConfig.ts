import { MousePointer2, Plus, Trash2 } from 'lucide-react'
import type { ToolbarModeConfig } from '../WorkspaceToolbar'

export const PRIVACY_TOOLBAR_MODES: ToolbarModeConfig[] = [
  { id: 'navigate', icon: MousePointer2, label: '탐색', shortcut: 'V' },
  { id: 'place_point', icon: Plus, label: '창문 추가', shortcut: 'P' },
  { id: 'delete', icon: Trash2, label: '삭제', shortcut: 'D' },
]
