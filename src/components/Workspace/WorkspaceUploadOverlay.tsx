'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { CloudUpload, ArrowRight, Building2, MapPin, Sun } from 'lucide-react'

interface WorkspaceUploadOverlayProps {
  onFileSelect: (file: File, mtlFile?: File) => void
  accept?: string
  isUploading?: boolean
  hint?: string
  maxSizeMB?: number
  /** Optional: load a sample project from the API */
  onLoadSample?: () => void
  /** Optional: module name for contextual guidance */
  moduleName?: string
  /** Upload progress 0-100, null if not tracking */
  uploadProgress?: number | null
}

const UNSUPPORTED_HINTS: Record<string, string> = {
  ifc: 'IFC: Revit/ArchiCAD에서 OBJ로 내보내기 후 업로드하세요.',
  skp: 'SketchUp: 파일 > 내보내기 > 3D 모델 > OBJ로 내보내세요.',
  '3ds': '3DS: 3D 소프트웨어에서 OBJ로 변환 후 업로드하세요.',
  fbx: 'FBX: Blender 등에서 OBJ로 변환 후 업로드하세요.',
  stl: 'STL: Blender 등에서 OBJ로 변환 후 업로드하세요.',
  rvt: 'Revit: 파일 > 내보내기 > CAD 형식 > OBJ로 내보내세요.',
  dxf: 'DXF: OBJ 또는 SN5F 형식으로 변환 후 업로드하세요.',
}

const WORKFLOW_STEPS = [
  { icon: Building2, label: '3D 모델 업로드', desc: 'OBJ / SN5F 파일' },
  { icon: MapPin, label: '측정점 배치', desc: '건물 표면에 클릭' },
  { icon: Sun, label: '분석 실행', desc: '법규 판정 + 보고서' },
]

export default function WorkspaceUploadOverlay({
  onFileSelect,
  accept = '.obj,.sn5f,.mtl',
  isUploading = false,
  hint = 'OBJ 또는 Sanalyst SN5F 파일을 드래그하세요 (최대 100MB)',
  maxSizeMB = 100,
  onLoadSample,
  moduleName: _moduleName,
  uploadProgress = null,
}: WorkspaceUploadOverlayProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [sizeError, setSizeError] = useState<string | null>(null)
  const [formatError, setFormatError] = useState<string | null>(null)
  const [fadePhase, setFadePhase] = useState<'visible' | 'fading' | 'hidden'>('visible')
  const inputRef = useRef<HTMLInputElement>(null)
  const prevUploading = useRef(isUploading)

  useEffect(() => {
    if (prevUploading.current && !isUploading) {
      setFadePhase('fading')
      const timer = setTimeout(() => setFadePhase('hidden'), 600)
      return () => clearTimeout(timer)
    }
    prevUploading.current = isUploading
  }, [isUploading])

  const maxBytes = maxSizeMB * 1024 * 1024

  const validateAndSelect = useCallback((file: File, mtlFile?: File) => {
    if (file.size > maxBytes) {
      setSizeError(`파일 크기(${(file.size / 1024 / 1024).toFixed(1)}MB)가 ${maxSizeMB}MB 제한을 초과합니다`)
      return
    }
    setSizeError(null)
    setFormatError(null)
    onFileSelect(file, mtlFile)
  }, [maxBytes, maxSizeMB, onFileSelect])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      setFormatError(null)
      if (isUploading) return
      const files = Array.from(e.dataTransfer.files)
      const valid = files.find((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase()
        return ext === 'obj' || ext === 'sn5f'
      })
      if (valid) {
        const mtl = files.find((f) => f.name.toLowerCase().endsWith('.mtl'))
        validateAndSelect(valid, mtl || undefined)
      } else if (files.length > 0) {
        const ext = files[0].name.split('.').pop()?.toLowerCase() || ''
        const hintMsg = UNSUPPORTED_HINTS[ext]
        setFormatError(hintMsg || `".${ext}" 형식은 지원되지 않습니다. OBJ 또는 SN5F 파일을 업로드하세요.`)
      }
    },
    [accept, isUploading, validateAndSelect]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return
      const files = Array.from(e.target.files)
      const main = files.find((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase()
        return ext === 'obj' || ext === 'sn5f'
      })
      if (main) {
        const mtl = files.find((f) => f.name.toLowerCase().endsWith('.mtl'))
        validateAndSelect(main, mtl || undefined)
      }
      e.target.value = ''
    },
    [validateAndSelect]
  )

  if (fadePhase === 'hidden') return null

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center z-10
        transition-opacity duration-500 ease-out
        ${fadePhase === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onDragOver={(e) => {
        e.preventDefault()
        if (!isUploading) setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="max-w-lg w-full mx-4 space-y-4">
        {/* ── Workflow Steps ── */}
        <div className="flex items-center justify-center gap-2 px-4">
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs
                ${i === 0 ? 'bg-white/95 text-gray-900 font-semibold shadow-sm' : 'bg-white/20 text-white/80'}`}
              >
                <step.icon size={14} strokeWidth={i === 0 ? 2 : 1.5} />
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.desc}</span>
              </div>
              {i < WORKFLOW_STEPS.length - 1 && (
                <ArrowRight size={14} className="text-white/40 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* ── Upload Card ── */}
        <div
          onClick={() => !isUploading && inputRef.current?.click()}
          className={`bg-white/95 rounded-xl border-2 border-dashed p-10 text-center
            transition-all duration-300 shadow-2xl ${
              isUploading
                ? 'border-gray-300 cursor-not-allowed opacity-80'
                : isDragging
                ? 'border-red-500 bg-red-50/90 scale-[1.02] shadow-red-200/50'
                : 'border-gray-300 hover:border-red-400 cursor-pointer'
            }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleChange}
            className="hidden"
            disabled={isUploading}
          />
          {isUploading ? (
            <div className="space-y-4">
              <div className="w-10 h-10 border-[2.5px] border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium text-gray-600">
                {uploadProgress != null && uploadProgress < 100
                  ? `업로드 중... ${uploadProgress}%`
                  : uploadProgress === 100
                    ? '서버에서 처리 중...'
                    : '업로드 중...'}
              </p>
              {uploadProgress != null && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-red-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                  />
                </div>
              )}
              <p className="text-xs text-gray-500">잠시만 기다려 주세요</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                <CloudUpload size={28} strokeWidth={1.3} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  3D 모델 파일을 드래그하거나 클릭하세요
                </p>
                <p className="text-xs text-gray-500 mt-1.5">{hint}</p>
              </div>
              {/* Supported formats */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
                <span className="px-2 py-0.5 bg-gray-100 rounded font-mono">.obj</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded font-mono">.sn5f</span>
                <span className="text-gray-300">|</span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-500 rounded font-mono">.mtl</span>
                <span className="text-gray-400">(선택)</span>
              </div>
              <p className="text-[11px] text-gray-500">
                MTL 파일이 있으면 OBJ와 함께 선택하세요 (드래그 또는 Ctrl/Cmd+클릭)
              </p>
              {/* Errors */}
              {sizeError && (
                <p className="text-xs text-red-500 font-medium">{sizeError}</p>
              )}
              {formatError && (
                <p className="text-xs text-red-500 font-medium">{formatError}</p>
              )}
            </div>
          )}
        </div>

        {/* ── Sample Project Button ── */}
        {!isUploading && onLoadSample && (
          <div className="text-center">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLoadSample()
              }}
              className="text-xs text-white/70 hover:text-white transition-colors
                underline underline-offset-2 decoration-white/30 hover:decoration-white/60"
            >
              샘플 프로젝트로 시작하기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
