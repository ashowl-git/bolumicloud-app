'use client'

import { ExternalLink } from 'lucide-react'

const HOMEPAGE_URL = 'https://askwhy.works'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer id="contact" className="relative py-16 px-6 border-t border-gray-200 overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">

        {/* Sitemap Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: BoLumiCloud */}
          <div>
            <h4 className="text-xs text-slate-400 uppercase tracking-widest mb-4 font-normal">
              BoLumiCloud
            </h4>
            <ul className="space-y-2">
              <li><a href="/" className="text-xs text-slate-500 hover:text-red-600 transition-colors duration-300">Home</a></li>
              <li><a href="https://api.askwhy.works/docs" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-red-600 transition-colors duration-300">API Docs</a></li>
            </ul>
          </div>

          {/* Column 2: Tools */}
          <div>
            <h4 className="text-xs text-slate-400 uppercase tracking-widest mb-4 font-normal">
              Tools
            </h4>
            <ul className="space-y-2">
              <li><a href="https://calzeb.askwhy.works" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-red-600 transition-colors duration-300">CalZEB</a></li>
              <li><a href={`${HOMEPAGE_URL}/nuggets/lm-eco2od`} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-red-600 transition-colors duration-300">Energy Calculator</a></li>
              <li><a href={`${HOMEPAGE_URL}/nuggets/law-checker`} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-red-600 transition-colors duration-300">Law Tracker</a></li>
            </ul>
          </div>

          {/* Column 3: Research */}
          <div>
            <h4 className="text-xs text-slate-400 uppercase tracking-widest mb-4 font-normal">
              Research
            </h4>
            <ul className="space-y-2">
              <li><a href={`${HOMEPAGE_URL}/layers`} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-red-600 transition-colors duration-300">Layers</a></li>
              <li><a href={`${HOMEPAGE_URL}/publications`} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-red-600 transition-colors duration-300">Publications</a></li>
              <li><a href={`${HOMEPAGE_URL}/nuggets`} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-red-600 transition-colors duration-300">Nuggets</a></li>
            </ul>
          </div>

          {/* Column 4: About */}
          <div>
            <h4 className="text-xs text-slate-400 uppercase tracking-widest mb-4 font-normal">
              About
            </h4>
            <ul className="space-y-2">
              <li><a href={HOMEPAGE_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-red-600 transition-colors duration-300">Research Division</a></li>
              <li><a href={`${HOMEPAGE_URL}/interface`} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-red-600 transition-colors duration-300">Interface</a></li>
            </ul>
          </div>
        </div>

        {/* Contact & Info */}
        <div className="grid md:grid-cols-2 gap-12 mb-12 border-t border-gray-200 pt-12">
          <div>
            <a
              href={HOMEPAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 group"
            >
              <h3 className="text-sm text-slate-400 uppercase tracking-widest font-normal group-hover:text-red-600 transition-colors duration-300">
                Research Divisi<span className="text-red-600">o</span>n
              </h3>
              <ExternalLink size={12} className="text-slate-400 group-hover:text-red-600 transition-colors duration-300" />
            </a>
            <p className="text-xs text-slate-500 font-normal mt-4">
              EAN Technology
            </p>
          </div>

          <div>
            <h3 className="text-sm text-slate-400 uppercase tracking-widest mb-4 font-normal">
              INTERFACE
            </h3>
            <div className="space-y-2">
              <a
                href="mailto:sha@eantec.co.kr"
                className="block text-xs text-slate-500 hover:text-slate-900 transition-colors duration-300 font-normal"
              >
                sha@eantec.co.kr
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 pt-6">
          <p className="text-xs text-slate-400 font-normal text-center">
            &copy; {currentYear} EAN Technology Research Division. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
