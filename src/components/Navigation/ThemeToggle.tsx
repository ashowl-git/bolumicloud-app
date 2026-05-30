'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

const STORAGE_KEY = 'bolumicloud-theme'

// ─── ThemeToggle ─────────────────────────────
// 라이트/다크 전환. 무플래시 스크립트(root layout)가 페인트 전 .dark 를 적용하고,
// 이 토글이 documentElement.classList 와 localStorage 를 동기화한다.

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    const root = document.documentElement
    if (next) {
      root.classList.add('dark')
      localStorage.setItem(STORAGE_KEY, 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem(STORAGE_KEY, 'light')
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      title={isDark ? '라이트 모드' : '다크 모드'}
      className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
