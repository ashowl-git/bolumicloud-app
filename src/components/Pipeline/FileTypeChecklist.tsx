'use client'

interface FileTypeChecklistProps {
  vfFile: File | null
  objFile: File | null
  mtlFile: File | null
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface FileRowProps {
  ext: string
  file: File | null
  required: boolean
  description: string
}

function FileRow({ ext, file, required, description }: FileRowProps) {
  const status = file
    ? 'uploaded'
    : required
    ? 'missing-required'
    : 'missing-optional'

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-8 flex-shrink-0 pt-0.5">
        {status === 'uploaded' && (
          <span className="text-green-600 text-sm font-bold">[OK]</span>
        )}
        {status === 'missing-required' && (
          <span className="text-red-500 text-sm font-bold">[--]</span>
        )}
        {status === 'missing-optional' && (
          <span className="text-amber-500 text-sm font-bold">[!]</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">.{ext}</span>
          {file && (
            <span className="text-xs text-gray-400 truncate">
              {file.name} ({formatSize(file.size)})
            </span>
          )}
          {!file && required && (
            <span className="text-xs text-red-400">필수</span>
          )}
          {!file && !required && (
            <span className="text-xs text-amber-400">선택</span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

export default function FileTypeChecklist({ vfFile, objFile, mtlFile }: FileTypeChecklistProps) {
  return (
    <div className="mt-4 space-y-1">
      <FileRow
        ext="vf"
        file={vfFile}
        required
        description="카메라 위치와 방향 (SketchUp Ruby 내보내기)"
      />
      <FileRow
        ext="obj"
        file={objFile}
        required
        description="3D 건물 모델 (SketchUp 내보내기)"
      />
      <FileRow
        ext="mtl"
        file={mtlFile}
        required={false}
        description="재질 정의 (없으면 모든 면이 회색으로 렌더링됨)"
      />

      {!mtlFile && (
        <div className="border border-amber-200 bg-amber-50 p-3 mt-3">
          <p className="text-xs text-amber-700">
            재질 파일(MTL)이 없습니다. 모든 면이 기본 회색으로 렌더링됩니다.
            반사율, 투과율 등 재질 속성이 분석 정확도에 영향을 줍니다.
          </p>
        </div>
      )}
    </div>
  )
}
