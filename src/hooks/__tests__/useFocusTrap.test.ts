import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFocusTrap } from '../useFocusTrap'
import { type RefObject } from 'react'

describe('useFocusTrap', () => {
  function createContainer(): HTMLDivElement {
    const container = document.createElement('div')
    const btn1 = document.createElement('button')
    btn1.textContent = 'First'
    const btn2 = document.createElement('button')
    btn2.textContent = 'Second'
    const btn3 = document.createElement('button')
    btn3.textContent = 'Third'
    container.appendChild(btn1)
    container.appendChild(btn2)
    container.appendChild(btn3)
    document.body.appendChild(container)
    return container
  }

  it('focuses first focusable element when activated', () => {
    const container = createContainer()
    const ref = { current: container } as RefObject<HTMLElement | null>

    renderHook(() => useFocusTrap(ref, true))

    const firstBtn = container.querySelector('button')
    expect(document.activeElement).toBe(firstBtn)

    document.body.removeChild(container)
  })

  it('does nothing when isActive is false', () => {
    const container = createContainer()
    const ref = { current: container } as RefObject<HTMLElement | null>
    const prevFocus = document.activeElement

    renderHook(() => useFocusTrap(ref, false))

    // Focus should not have changed
    expect(document.activeElement).toBe(prevFocus)

    document.body.removeChild(container)
  })

  it('does nothing when ref.current is null', () => {
    const ref = { current: null } as RefObject<HTMLElement | null>

    // Should not throw
    expect(() => {
      renderHook(() => useFocusTrap(ref, true))
    }).not.toThrow()
  })

  it('restores focus on unmount', () => {
    const outerBtn = document.createElement('button')
    outerBtn.textContent = 'Outer'
    document.body.appendChild(outerBtn)
    outerBtn.focus()

    const container = createContainer()
    const ref = { current: container } as RefObject<HTMLElement | null>

    const { unmount } = renderHook(() => useFocusTrap(ref, true))

    // Focus moved into trap
    expect(document.activeElement).not.toBe(outerBtn)

    unmount()

    // Focus restored to outer button
    expect(document.activeElement).toBe(outerBtn)

    document.body.removeChild(container)
    document.body.removeChild(outerBtn)
  })
})
