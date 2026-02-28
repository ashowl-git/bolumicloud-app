'use client'

import { useState, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { LocaleContext } from '@/hooks/useLocalizedText'
import type { Locale } from '@/lib/types/i18n'
import BoLumiCloudMark from '@/components/BoLumiCloud/BoLumiCloudMark'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { locale, setLocale } = useContext(LocaleContext)

  const navItems = [
    { label: 'HOME', href: '/' },
  ]

  const toggleLocale = () => {
    setLocale(locale === 'ko' ? 'en' : 'ko' as Locale)
  }

  return (
    <div className="fixed left-0 right-0 z-50 flex justify-center top-8">
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-[92%] max-w-5xl"
        whileHover={{
          y: -4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 16px 64px rgba(0,0,0,0.08)'
        }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="relative px-8 py-4 backdrop-blur-2xl border border-slate-200/60 bg-white text-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.08),0_8px_32px_rgba(0,0,0,0.06)] rounded-2xl">

          {/* Top ruler */}
          <div className="absolute top-0 left-0 right-0 h-3 border-b border-slate-200">
            <span className="absolute left-2 top-0.5 text-[8px] font-mono text-slate-400">1:100</span>
            <div className="absolute top-0 left-16 right-16 h-full flex items-start">
              <div className="w-full flex justify-between">
                {[...Array(26)].map((_, i) => {
                  const isMajor = i % 5 === 0
                  return (
                    <div
                      key={`top-${i}`}
                      className={isMajor ? 'h-2.5 w-[1.5px] bg-slate-400' : 'h-1.5 w-[1px] bg-slate-300'}
                    />
                  )
                })}
              </div>
            </div>
            <span className="absolute right-2 top-0.5 text-[8px] font-mono text-slate-400">100</span>
          </div>

          {/* Left ruler ticks */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={`left-${i}`} className="w-1.5 h-[1px] bg-slate-300/60" />
            ))}
          </div>

          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5" aria-label="BoLumiCloud 홈으로 이동">
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }} className="flex items-center gap-2.5">
                <BoLumiCloudMark size={28} className="text-slate-900" />
                <div className="text-xl font-normal tracking-wide text-slate-900">
                  B<span className="text-red-600">o</span>LumiCloud<span className="text-red-600">.</span>
                </div>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {navItems.map((item, index) => (
                  <Link key={index} href={item.href}>
                    <motion.div
                      className="px-4 py-2 text-sm font-normal tracking-wide text-slate-600 hover:text-slate-900 transition-colors duration-300 relative group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {item.label}
                      <span className="absolute bottom-0 left-4 right-4 h-[3px] bg-red-600 transition-all duration-300 origin-left scale-x-0 group-hover:scale-x-100" />
                    </motion.div>
                  </Link>
                ))}

                <a
                  href="https://askwhy.works"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-normal tracking-wide text-slate-400 hover:text-slate-600 transition-colors duration-300"
                >
                  Research
                </a>
              </div>

              {/* Language toggle */}
              <div className="flex items-center space-x-1 ml-3">
                <div className="h-4 w-[0.5px] mx-2 bg-slate-200" />
                <button
                  onClick={toggleLocale}
                  className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 border border-slate-200 rounded transition-colors"
                >
                  {locale === 'ko' ? 'EN' : 'KO'}
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden p-2 text-slate-900"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileTap={{ scale: 0.95 }}
              aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </motion.button>
          </div>

          {/* Right ruler ticks */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={`right-${i}`} className="w-1.5 h-[1px] bg-slate-300/60" />
            ))}
          </div>

          {/* Bottom ruler */}
          <div className="absolute bottom-0 left-0 right-0 h-3 border-t border-slate-200">
            <span className="absolute left-2 bottom-0.5 text-[8px] font-mono text-slate-400">1:200</span>
            <div className="absolute bottom-0 left-16 right-16 h-full flex items-end">
              <div className="w-full flex justify-between">
                {[...Array(51)].map((_, i) => {
                  const isMajor = i % 10 === 0
                  const isMedium = i % 5 === 0 && i % 10 !== 0
                  return (
                    <div
                      key={`bottom-${i}`}
                      className={
                        isMajor ? 'h-2.5 w-[1.5px] bg-slate-400' :
                        isMedium ? 'h-2 w-[1px] bg-slate-300' :
                        'h-1.5 w-[0.5px] bg-slate-300/60'
                      }
                    />
                  )
                })}
              </div>
            </div>
            <span className="absolute right-2 bottom-0.5 text-[8px] font-mono text-slate-400">200</span>
          </div>

          {/* Depth effects */}
          <div className="absolute top-3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-300/30 to-transparent pointer-events-none" />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-slate-50/10 pointer-events-none" />

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden mt-4 bg-amber-50/98 backdrop-blur-2xl rounded-2xl p-4 border border-gray-200/40 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
              >
                {navItems.map((item, index) => (
                  <Link key={index} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <motion.div
                      className="block py-3 text-slate-600 hover:text-slate-900 transition-colors font-normal"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {item.label}
                    </motion.div>
                  </Link>
                ))}

                <a
                  href="https://askwhy.works"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-3 text-slate-400 hover:text-slate-600 transition-colors font-normal text-sm"
                >
                  Research Division
                </a>

                <div className="mt-2 pt-3 border-t border-slate-200/40">
                  <button
                    onClick={() => { toggleLocale(); setIsMobileMenuOpen(false) }}
                    className="block py-3 text-slate-600 hover:text-slate-900 transition-colors font-normal text-sm"
                  >
                    {locale === 'ko' ? 'English' : '한국어'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>
    </div>
  )
}
