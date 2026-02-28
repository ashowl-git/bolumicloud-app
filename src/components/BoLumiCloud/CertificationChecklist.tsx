'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

function loadChecks(key: string): Record<string, boolean> {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : {}
  } catch { return {} }
}

export default function CertificationChecklist() {
  const [greenBuildingChecks, setGreenBuildingChecks] = useState<Record<string, boolean>>(
    () => loadChecks('bolumicloud:cert:green')
  )
  const [leedChecks, setLeedChecks] = useState<Record<string, boolean>>(
    () => loadChecks('bolumicloud:cert:leed')
  )
  const [wellChecks, setWellChecks] = useState<Record<string, boolean>>(
    () => loadChecks('bolumicloud:cert:well')
  )

  useEffect(() => {
    try { localStorage.setItem('bolumicloud:cert:green', JSON.stringify(greenBuildingChecks)) } catch {}
  }, [greenBuildingChecks])

  useEffect(() => {
    try { localStorage.setItem('bolumicloud:cert:leed', JSON.stringify(leedChecks)) } catch {}
  }, [leedChecks])

  useEffect(() => {
    try { localStorage.setItem('bolumicloud:cert:well', JSON.stringify(wellChecks)) } catch {}
  }, [wellChecks])

  const greenBuildingItems = [
    { id: 'gb1', title: '실내 마감재료의 오염물질 방출 기준 만족', category: '실내환경' },
    { id: 'gb2', title: '실내공기질 기준 만족 (CO₂, HCHO, TVOC)', category: '실내환경' },
    { id: 'gb3', title: '결로 방지 성능 확보', category: '실내환경' },
    { id: 'gb4', title: '자연채광 및 조망 확보 (주거공간 75% 이상)', category: '조명/채광' },
    { id: 'gb5', title: '불능현휘 방지 (DGP < 0.45 or DGI < 31)', category: '조명/채광' },
    { id: 'gb6', title: '인공조명 밀도 기준 만족 (15W/m² 이하)', category: '에너지' },
    { id: 'gb7', title: '에너지 성능지표 1++ 등급', category: '에너지' },
  ]

  const leedItems = [
    { id: 'l1', title: 'EQc7: Daylight - Option 1 (공간 75% 이상 300-3000 lux)', category: 'IEQ' },
    { id: 'l2', title: 'EQc7: Daylight - Option 2 (sDA 55%, ASE 10% 이하)', category: 'IEQ' },
    { id: 'l3', title: 'EQc8: Quality Views (90% 공간에서 조망 확보)', category: 'IEQ' },
    { id: 'l4', title: 'EQc9: Acoustic Performance (배경소음 40dBA 이하)', category: 'IEQ' },
    { id: 'l5', title: 'EAp2: Minimum Energy Performance (기준선 대비 5% 절감)', category: 'Energy' },
    { id: 'l6', title: 'EAc1: Optimize Energy Performance (10-48% 절감)', category: 'Energy' },
  ]

  const wellItems = [
    { id: 'w1', title: 'L02: Visual Lighting Design (최소 215 lux, 평균 300 lux)', category: 'Light' },
    { id: 'w2', title: 'L03: Circadian Lighting Design (EML 150+ lux at eye)', category: 'Light' },
    { id: 'w3', title: 'L07: Electric Light Glare Control (UGR < 19)', category: 'Light' },
    { id: 'w4', title: 'L08: Daylight Fenestration (창문면적 7% 이상)', category: 'Light' },
    { id: 'w5', title: 'L09: Daylight Modeling (sDA 300/50% > 55%)', category: 'Light' },
    { id: 'w6', title: 'A01: Air Quality Standards (PM2.5 < 15 µg/m³)', category: 'Air' },
  ]

  const toggleCheck = (
    checks: Record<string, boolean>,
    setChecks: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
    id: string
  ) => {
    setChecks(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const calculateProgress = (checks: Record<string, boolean>, total: number) => {
    const completed = Object.values(checks).filter(Boolean).length
    return Math.round((completed / total) * 100)
  }

  const renderSection = (
    title: string,
    subtitle: string,
    items: { id: string; title: string; category: string }[],
    checks: Record<string, boolean>,
    setChecks: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  ) => {
    const progress = calculateProgress(checks, items.length)

    return (
      <div className="border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-normal text-gray-900">{title}</h3>
            <p className="text-sm text-gray-800 mt-1">{subtitle}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-light text-red-600">{progress}%</div>
            <div className="text-xs text-gray-800">
              {Object.values(checks).filter(Boolean).length}/{items.length}
            </div>
          </div>
        </div>

        <div className="w-full h-1 bg-gray-200 mb-6">
          <div
            className="h-full bg-red-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 p-3 border border-gray-200
                hover:border-gray-300 transition-colors cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={checks[item.id] || false}
                onChange={() => toggleCheck(checks, setChecks, item.id)}
                className="mt-0.5 w-4 h-4 accent-red-600"
              />
              <div className="flex-1">
                <div className="text-sm text-gray-900 group-hover:text-red-600 transition-colors">
                  {item.title}
                </div>
                <div className="text-xs text-gray-800 mt-1">
                  {item.category}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-light text-gray-900 mb-6">
          인증 체크리스트
        </h2>
        <div className="w-24 h-px bg-gray-300 mb-6" />

        <p className="text-base text-gray-800 mb-8 leading-relaxed">
          녹색건축 인증, LEED, WELL Building Standard의 조명/환경 관련 필수 기준을 확인하세요.
        </p>

        {renderSection(
          '녹색건축 인증',
          '한국 녹색건축 인증 (G-SEED) 조명 및 실내환경 기준',
          greenBuildingItems,
          greenBuildingChecks,
          setGreenBuildingChecks
        )}

        {renderSection(
          'LEED v4.1',
          'LEED (Leadership in Energy and Environmental Design) 실내환경 품질 및 에너지 기준',
          leedItems,
          leedChecks,
          setLeedChecks
        )}

        {renderSection(
          'WELL Building Standard v2',
          'WELL Building Standard 조명 및 공기질 기준',
          wellItems,
          wellChecks,
          setWellChecks
        )}

        {/* 설명 */}
        <div className="mt-8 p-6 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">참고 사항</h4>

          <div className="space-y-3 text-sm text-gray-800">
            <p>
              <span className="font-medium text-gray-900">녹색건축 인증:</span>
              한국 국토교통부가 인증하는 친환경 건축물 인증제도입니다.
              조명/채광 분야는 필수 항목입니다.
            </p>
            <p>
              <span className="font-medium text-gray-900">LEED:</span>
              미국 USGBC에서 운영하는 세계적인 친환경 건축 인증입니다.
              EQc7 (Daylight)는 2-3점을 획득할 수 있습니다.
            </p>
            <p>
              <span className="font-medium text-gray-900">WELL:</span>
              건강 중심 건축 인증으로, 거주자의 웰빙을 중시합니다.
              L07 (Glare Control)은 UGR 19 이하를 요구합니다.
            </p>
            <p className="text-xs text-gray-800 mt-4">
              이 체크리스트는 참고용입니다. 정확한 인증 기준은 공식 문서를 확인하세요.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
