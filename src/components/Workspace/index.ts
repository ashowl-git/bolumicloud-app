// Workspace — barrel exports

// Layout
export { default as AnalysisWorkspace } from './AnalysisWorkspace'
export { default as WorkspaceViewport } from './WorkspaceViewport'
export { default as WorkspaceSidePanel } from './WorkspaceSidePanel'
export { default as WorkspacePanelSection } from './WorkspacePanelSection'
export { default as WorkspaceToolbar } from './WorkspaceToolbar'
export { default as WorkspaceStatusBar } from './WorkspaceStatusBar'
export { default as WorkspaceUploadOverlay } from './WorkspaceUploadOverlay'

// Hooks
export { useWorkspaceLayout } from './hooks/useWorkspaceLayout'

// Types
export type { ToolbarModeConfig } from './WorkspaceToolbar'
export type { StatusBarState } from './WorkspaceStatusBar'
export type { PanelTab } from './hooks/useWorkspaceLayout'
