import { MousePointer2, Eye, Trash2 } from 'lucide-react'
import type { ToolbarModeConfig } from '../WorkspaceToolbar'

export const VIEW_TOOLBAR_MODES: ToolbarModeConfig[] = [
  { id: 'navigate', icon: MousePointer2, label: '탐색', shortcut: 'V' },
  { id: 'place_point', icon: Eye, label: '관찰점 추가', shortcut: 'P' },
  { id: 'delete', icon: Trash2, label: '삭제', shortcut: 'D' },
]
