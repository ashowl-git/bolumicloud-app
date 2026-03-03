'use client'

import { useCallback } from 'react'
import { Building2 } from 'lucide-react'
import type { SanalystProjectInfo } from '@/lib/types/sunlight'

interface SanalystProjectInfoFormProps {
  value: SanalystProjectInfo
  onChange: (info: SanalystProjectInfo) => void
}

const EMPTY_INFO: SanalystProjectInfo = {
  project_name: '',
  address: '',
  applicant: '',
  company_name: '',
  analyst: '',
  analysis_date: '',
  analysis_tool: 'BoLumiCloud',
  notes: '',
}

export default function SanalystProjectInfoForm({
  value,
  onChange,
}: SanalystProjectInfoFormProps) {
  const handleChange = useCallback(
    (field: keyof SanalystProjectInfo, v: string) => {
      onChange({ ...value, [field]: v })
    },
    [value, onChange],
  )

  const fields: { key: keyof SanalystProjectInfo; label: string; placeholder: string }[] = [
    { key: 'project_name', label: '단지명', placeholder: '예: 흑석1구역 재개발' },
    { key: 'address', label: '주소', placeholder: '예: 서울시 동작구 흑석동' },
    { key: 'applicant', label: '신청인', placeholder: '' },
    { key: 'company_name', label: '업체명', placeholder: '' },
    { key: 'analyst', label: '분석자', placeholder: '' },
    { key: 'analysis_date', label: '분석일', placeholder: '예: 2026-03-04' },
  ]

  return (
    <div className="border border-gray-200 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Building2 size={16} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-900">
          프로젝트 정보 (인허가 모드)
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key} className={key === 'address' ? 'col-span-2' : ''}>
            <label className="block text-xs text-gray-500 mb-1">{label}</label>
            <input
              type="text"
              value={value[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              className="w-full border border-gray-200 px-3 py-1.5 text-sm
                focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">비고</label>
        <textarea
          value={value.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={2}
          className="w-full border border-gray-200 px-3 py-1.5 text-sm resize-none
            focus:outline-none focus:border-gray-400 transition-colors"
        />
      </div>
    </div>
  )
}

export { EMPTY_INFO }
