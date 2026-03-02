'use client'

import type { ReactNode } from 'react'

interface AnalysisWorkspaceProps {
  /** 3D viewport content (ThreeViewer + scene children) */
  children: ReactNode
  /** Toolbar overlay (top-left) */
  toolbar?: ReactNode
  /** Side panel overlay (right) */
  sidePanel?: ReactNode
  /** Status bar overlay (bottom) */
  statusBar?: ReactNode
  /** Bottom controls (e.g. shadow slider) */
  bottomControls?: ReactNode
  /** Upload overlay (center, shown when no model) */
  uploadOverlay?: ReactNode
}

export default function AnalysisWorkspace({
  children,
  toolbar,
  sidePanel,
  statusBar,
  bottomControls,
  uploadOverlay,
}: AnalysisWorkspaceProps) {
  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 56px)' }}>
      {/* 3D Viewport — fills entire container */}
      <div className="absolute inset-0">
        {children}
      </div>

      {/* Toolbar — top-left, over 3D */}
      {toolbar && (
        <div className="absolute top-4 left-4 z-20">
          {toolbar}
        </div>
      )}

      {/* Side Panel — right, over 3D */}
      {sidePanel && (
        <div className="absolute top-0 right-0 bottom-0 z-20">
          {sidePanel}
        </div>
      )}

      {/* Bottom Controls (shadow slider etc.) — bottom center, above status bar */}
      {bottomControls && (
        <div className="absolute bottom-14 left-0 right-0 z-10 flex justify-center pointer-events-none">
          <div className="pointer-events-auto">
            {bottomControls}
          </div>
        </div>
      )}

      {/* Status Bar — bottom */}
      {statusBar && (
        <div className="absolute bottom-0 left-0 right-0 z-10">
          {statusBar}
        </div>
      )}

      {/* Upload Overlay — center, over everything */}
      {uploadOverlay && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          {uploadOverlay}
        </div>
      )}
    </div>
  )
}
