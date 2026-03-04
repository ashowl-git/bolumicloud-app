'use client'

import { useState, useEffect, type RefObject } from 'react'

/**
 * ResizeObserver를 래핑하여 요소의 크기를 반환하는 커스텀 훅.
 *
 * WaldramChart, SunPathDiagram 등 반응형 차트 컴포넌트에서 공통 사용.
 */
export function useResizeObserver(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!ref.current) return
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref])

  return size
}
