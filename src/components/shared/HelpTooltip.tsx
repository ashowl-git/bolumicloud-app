'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'

interface HelpTooltipProps {
  text: string
}

export default function HelpTooltip({ text }: HelpTooltipProps) {
  const [show, setShow] = useState(false)

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => { e.preventDefault(); setShow(!show) }}
        className="text-gray-300 hover:text-gray-500 transition-colors"
        aria-label="도움말"
      >
        <HelpCircle size={11} />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50
          bg-gray-900 text-white text-[10px] leading-relaxed px-2.5 py-1.5
          rounded shadow-lg max-w-[200px] whitespace-normal"
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
            border-l-[4px] border-r-[4px] border-t-[4px]
            border-l-transparent border-r-transparent border-t-gray-900" />
        </div>
      )}
    </span>
  )
}
