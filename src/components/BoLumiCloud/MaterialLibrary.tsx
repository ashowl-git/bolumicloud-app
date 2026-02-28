'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { logger } from '@/lib/logger'
import { useApiClient } from '@/lib/api'
import { useApi } from '@/contexts/ApiContext'
import { useToast } from '@/contexts/ToastContext'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import { LocalizedText } from '@/lib/types/i18n'

// Localized text for Material Library
const materialLibraryText = {
  title: {
    ko: '재질 라이브러리',
    en: 'Material Library'
  } as LocalizedText,
  description: {
    ko: 'Radiance 기본 재질 라이브러리 - 렌더링에 사용 가능한 재질 정의',
    en: 'Radiance default material library - Material definitions available for rendering'
  } as LocalizedText,
  searchPlaceholder: {
    ko: '재질 검색...',
    en: 'Search materials...'
  } as LocalizedText,
  allCategory: {
    ko: '전체',
    en: 'All'
  } as LocalizedText,
  materialDefinition: {
    ko: '재질 정의',
    en: 'Material Definition'
  } as LocalizedText,
  copy: {
    ko: '복사',
    en: 'Copy'
  } as LocalizedText,
  copied: {
    ko: '복사됨!',
    en: 'Copied!'
  } as LocalizedText,
  clipboardCopied: {
    ko: '클립보드에 복사되었습니다',
    en: 'Copied to clipboard'
  } as LocalizedText,
  materialTypes: {
    ko: '재질 타입',
    en: 'Material Types'
  } as LocalizedText,
  plasticDesc: {
    ko: '난반사 재질 (벽, 바닥)',
    en: 'Diffuse material (walls, floors)'
  } as LocalizedText,
  glassDesc: {
    ko: '투명 유리',
    en: 'Transparent glass'
  } as LocalizedText,
  mirrorDesc: {
    ko: '완전 반사',
    en: 'Perfect specular reflection'
  } as LocalizedText,
  metalDesc: {
    ko: '금속 재질',
    en: 'Metallic material'
  } as LocalizedText,
}

interface Material {
  name: string
  definition: string
  type: string
  color: string
}

export default function MaterialLibrary() {
  const api = useApiClient()
  const { apiUrl } = useApi()
  const { showToast } = useToast()
  const { t } = useLocalizedText()
  const [materials, setMaterials] = useState<Material[]>([])
  const [filtered, setFiltered] = useState<Material[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [definition, setDefinition] = useState<string>('')
  const [category, setCategory] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  const [copied, setCopied] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  // 재질 목록 로드 및 타입 분류
  useEffect(() => {
    const loadMaterials = async () => {
      setLoading(true)
      try {
        const data = await api.get('/materials/list')

        const enriched = await Promise.all(
          data.materials.map(async (name: string) => {
            const detail = await api.get(`/materials/${name}`)
            const def = detail.definition

            // 타입 파싱 (void TYPE ...)
            const type = def.split(' ')[1] || 'unknown'

            // RGB 색상 추출
            const color = extractColor(def, type)

            return { name, definition: def, type, color }
          })
        )

        setMaterials(enriched)
        setFiltered(enriched)
      } catch (e) {
        logger.error('Failed to load materials', e instanceof Error ? e : undefined)
        showToast({ type: 'error', message: '재질 목록을 불러오지 못하였습니다' })
      } finally {
        setLoading(false)
      }
    }

    loadMaterials()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl])

  // 색상 칩 생성 (RGB 값 추출)
  const extractColor = (def: string, type: string): string => {
    const parts = def.split(' ')

    if (type === 'plastic') {
      // RGB 값 (마지막 3개 숫자)
      const r = Math.round(parseFloat(parts[parts.length - 5] || '0.5') * 255)
      const g = Math.round(parseFloat(parts[parts.length - 4] || '0.5') * 255)
      const b = Math.round(parseFloat(parts[parts.length - 3] || '0.5') * 255)
      return `rgb(${r}, ${g}, ${b})`
    } else if (type === 'glass') {
      return 'rgba(200, 220, 255, 0.3)'
    } else if (type === 'mirror') {
      return 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 50%, #e0e0e0 100%)'
    } else if (type === 'metal') {
      return 'linear-gradient(135deg, #b0b0b0 0%, #d5d5d5 50%, #b0b0b0 100%)'
    }
    return '#888'
  }

  // 카테고리 및 검색 필터
  useEffect(() => {
    let result = materials

    // 카테고리 필터
    if (category !== 'all') {
      result = result.filter(m => m.type === category)
    }

    // 검색 필터
    if (search) {
      result = result.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    setFiltered(result)
  }, [category, search, materials])

  const handleSelect = (mat: Material) => {
    setSelected(mat.name)
    setDefinition(mat.definition)
  }

  const handleCopy = () => {
    if (definition) {
      navigator.clipboard.writeText(definition)
      setCopied(true)
      showToast({ type: 'success', message: t(materialLibraryText.clipboardCopied) })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const categories = [
    { id: 'all', label: t(materialLibraryText.allCategory) },
    { id: 'plastic', label: 'Plastic' },
    { id: 'glass', label: 'Glass' },
    { id: 'mirror', label: 'Mirror' },
    { id: 'metal', label: 'Metal' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-normal text-gray-900 mb-4">{t(materialLibraryText.title)}</h2>
        <p className="text-sm text-gray-800 mb-6">
          {t(materialLibraryText.description)}
        </p>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(materialLibraryText.searchPlaceholder)}
            className="w-full px-4 py-2 border border-gray-200 text-sm focus:outline-none focus:border-red-600/30 transition-colors"
          />
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 text-sm whitespace-nowrap transition-all duration-300
                ${category === cat.id
                  ? 'border-b-2 border-red-600 text-gray-900 font-medium'
                  : 'text-gray-800 hover:text-gray-900'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 재질 그리드 */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {loading ? (
            // 로딩 스켈레톤
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-gray-200 p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gray-200 flex-shrink-0" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            // 빈 상태
            <div className="col-span-3 py-12 text-center">
              <p className="text-sm text-gray-500">검색 결과가 없습니다</p>
            </div>
          ) : (
            filtered.map((mat) => (
              <div
                key={mat.name}
                onClick={() => handleSelect(mat)}
                className={`border p-4 cursor-pointer transition-all duration-300
                  ${selected === mat.name
                    ? 'border-red-600 bg-red-50'
                    : 'border-gray-200 hover:border-red-600/30'
                  }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {/* 색상 칩 */}
                  <div
                    className="w-8 h-8 border border-gray-300 flex-shrink-0"
                    style={{
                      background: mat.color,
                      boxShadow: mat.type === 'mirror' || mat.type === 'metal' ? 'inset 0 1px 2px rgba(255,255,255,0.5)' : 'none'
                    }}
                  />
                  <p className="text-sm font-medium text-gray-900">{mat.name}</p>
                </div>
                <p className="text-xs text-gray-800">{mat.type}</p>
              </div>
            ))
          )}
        </div>

        {/* 재질 정의 */}
        {definition && (
          <div className="border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-normal text-gray-900">{t(materialLibraryText.materialDefinition)}</h3>
              <button
                onClick={handleCopy}
                className="px-4 py-2 text-xs border border-gray-200 hover:border-red-600/30 transition-colors"
              >
                {copied ? t(materialLibraryText.copied) : t(materialLibraryText.copy)}
              </button>
            </div>
            <pre className="text-xs font-mono bg-amber-50/50 p-4 overflow-x-auto border border-gray-200">
              {definition}
            </pre>
          </div>
        )}
      </div>

      <div className="border border-gray-200 p-6 text-sm text-gray-800">
        <h4 className="font-medium text-gray-900 mb-2">{t(materialLibraryText.materialTypes)}</h4>
        <ul className="space-y-1">
          <li>• <span className="font-medium">plastic</span>: {t(materialLibraryText.plasticDesc)}</li>
          <li>• <span className="font-medium">glass</span>: {t(materialLibraryText.glassDesc)}</li>
          <li>• <span className="font-medium">mirror</span>: {t(materialLibraryText.mirrorDesc)}</li>
          <li>• <span className="font-medium">metal</span>: {t(materialLibraryText.metalDesc)}</li>
        </ul>
      </div>

    </motion.div>
  )
}
