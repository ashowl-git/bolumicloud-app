'use client'

import { type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import type { BoundingBox } from '@/components/shared/3d/types'

const ThreeViewer = dynamic(() => import('@/components/shared/3d/ThreeViewer'), { ssr: false })

interface WorkspaceViewportProps {
  children: ReactNode
  bbox?: BoundingBox | null
  orbitEnabled?: boolean
}

export default function WorkspaceViewport({
  children,
  bbox,
  orbitEnabled = true,
}: WorkspaceViewportProps) {
  return (
    <div className="w-full h-full">
      <ThreeViewer
        bbox={bbox}
        height="100%"
        orbitEnabled={orbitEnabled}
      >
        {children}
      </ThreeViewer>
    </div>
  )
}
