'use client'

import { type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import ThreeErrorBoundary from '@/components/common/ThreeErrorBoundary'
import type { BoundingBox } from '@/components/shared/3d/types'

const ThreeViewer = dynamic(() => import('@/components/shared/3d/ThreeViewer'), { ssr: false })

interface WorkspaceViewportProps {
  children: ReactNode
  bbox?: BoundingBox | null
  orbitEnabled?: boolean
  enableShadows?: boolean
}

export default function WorkspaceViewport({
  children,
  bbox,
  orbitEnabled = true,
  enableShadows,
}: WorkspaceViewportProps) {
  return (
    <div className="w-full h-full" role="region" aria-label="3D Viewer">
      <ThreeErrorBoundary height="100%">
        <ThreeViewer
          bbox={bbox}
          height="100%"
          orbitEnabled={orbitEnabled}
          enableShadows={enableShadows}
        >
          {children}
        </ThreeViewer>
      </ThreeErrorBoundary>
    </div>
  )
}
