'use client'

import { useRef, useEffect, useCallback } from 'react'
import { TransformControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type * as THREE from 'three'

export type TransformMode = 'translate' | 'rotate'

interface ModelTransformControlsProps {
  target: THREE.Object3D | null
  mode: TransformMode
  onTransformEnd?: (position: THREE.Vector3, rotation: THREE.Euler) => void
}

export default function ModelTransformControls({
  target,
  mode,
  onTransformEnd,
}: ModelTransformControlsProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)
  const { controls: orbitControls } = useThree()

  // Disable OrbitControls while dragging
  useEffect(() => {
    const tc = controlsRef.current
    if (!tc || !orbitControls) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbit = orbitControls as any
    const onDraggingChanged = (event: { value: boolean }) => {
      orbit.enabled = !event.value
    }

    tc.addEventListener('dragging-changed', onDraggingChanged)
    return () => {
      tc.removeEventListener('dragging-changed', onDraggingChanged)
      orbit.enabled = true
    }
  }, [orbitControls])

  // Handle transform end
  const handleMouseUp = useCallback(() => {
    if (!target || !onTransformEnd) return
    onTransformEnd(target.position.clone(), target.rotation.clone())
  }, [target, onTransformEnd])

  if (!target) return null

  return (
    <TransformControls
      ref={controlsRef}
      object={target}
      mode={mode}
      size={0.8}
      onMouseUp={handleMouseUp}
    />
  )
}
