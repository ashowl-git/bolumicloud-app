import { useState, useCallback, useEffect } from 'react'

export type PanelTab = 'settings' | 'results'

interface WorkspaceLayoutState {
  sidePanelOpen: boolean
  activePanelTab: PanelTab
  isUploadOverlayVisible: boolean
}

const STORAGE_KEY = 'workspace-layout'

function loadState(): Partial<WorkspaceLayoutState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function saveState(state: Partial<WorkspaceLayoutState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

const BREAKPOINT_COLLAPSE = 1024

export function useWorkspaceLayout(options?: { hasModel?: boolean }) {
  const saved = loadState()

  const [sidePanelOpen, setSidePanelOpen] = useState(saved.sidePanelOpen ?? true)
  const [activePanelTab, setActivePanelTab] = useState<PanelTab>(saved.activePanelTab ?? 'settings')
  const [isUploadOverlayVisible, setIsUploadOverlayVisible] = useState(!options?.hasModel)
  const [isShortcutOverlayVisible, setIsShortcutOverlayVisible] = useState(false)

  // Persist panel state
  useEffect(() => {
    saveState({ sidePanelOpen, activePanelTab })
  }, [sidePanelOpen, activePanelTab])

  // Show upload overlay when no model
  useEffect(() => {
    setIsUploadOverlayVisible(!options?.hasModel)
  }, [options?.hasModel])

  // Auto-collapse side panel on narrow viewports (< 1024px)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BREAKPOINT_COLLAPSE - 1}px)`)
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setSidePanelOpen(false)
      }
    }
    // Initial check
    handleChange(mq)
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  const togglePanel = useCallback(() => {
    setSidePanelOpen((prev) => !prev)
  }, [])

  const openPanel = useCallback((tab?: PanelTab) => {
    setSidePanelOpen(true)
    if (tab) setActivePanelTab(tab)
  }, [])

  const closePanel = useCallback(() => {
    setSidePanelOpen(false)
  }, [])

  const toggleShortcutOverlay = useCallback(() => {
    setIsShortcutOverlayVisible((prev) => !prev)
  }, [])

  const closeShortcutOverlay = useCallback(() => {
    setIsShortcutOverlayVisible(false)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      // Tab key toggles panel
      if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        togglePanel()
      }
      // Escape closes upload overlay
      if (e.key === 'Escape' && isUploadOverlayVisible && options?.hasModel) {
        setIsUploadOverlayVisible(false)
      }
      // "?" toggles keyboard shortcut overlay
      if (e.key === '?') {
        e.preventDefault()
        toggleShortcutOverlay()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePanel, isUploadOverlayVisible, options?.hasModel, toggleShortcutOverlay])

  return {
    sidePanelOpen,
    activePanelTab,
    isUploadOverlayVisible,
    isShortcutOverlayVisible,
    setSidePanelOpen,
    setActivePanelTab,
    setIsUploadOverlayVisible,
    togglePanel,
    openPanel,
    closePanel,
    toggleShortcutOverlay,
    closeShortcutOverlay,
  }
}
