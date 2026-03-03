import { MousePointer2, Plus, Grid3X3, Trash2, Move } from 'lucide-react'
import type { ToolbarModeConfig } from '../WorkspaceToolbar'

export const SUNLIGHT_TOOLBAR_MODES: ToolbarModeConfig[] = [
  { id: 'navigate', icon: MousePointer2, label: '탐색', shortcut: 'V' },
  { id: 'place_point', icon: Plus, label: '측정점 추가', shortcut: 'P' },
  { id: 'place_area', icon: Grid3X3, label: '측정 영역', shortcut: 'A' },
  { id: 'transform', icon: Move, label: '모델 이동', shortcut: 'T' },
  { id: 'delete', icon: Trash2, label: '삭제', shortcut: 'D' },
]
