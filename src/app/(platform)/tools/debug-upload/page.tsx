'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'

const DebugViewer = dynamic(() => import('./DebugViewer'), { ssr: false })

export default function DebugUploadPage() {
  const [log, setLog] = useState<string[]>([])
  const [sceneUrl, setSceneUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString()
    setLog((prev) => [...prev, `[${ts}] ${msg}`])
  }

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const handleUpload = async (file: File) => {
    addLog(`--- 업로드 시작: ${file.name} (${(file.size / 1024).toFixed(0)}KB) ---`)
    setIsUploading(true)
    setSceneUrl(null)

    try {
      // Step 1: /import/obj
      addLog('Step 1: POST /import/obj ...')
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API}/import/obj`, { method: 'POST', body: formData })
      addLog(`  응답: ${res.status} ${res.statusText}`)

      if (!res.ok) {
        const err = await res.text()
        addLog(`  에러: ${err}`)
        return
      }

      const data = await res.json()
      addLog(`  model_id: ${data.model_id}`)
      addLog(`  scene_url: ${data.scene_url}`)
      addLog(`  groups: ${data.groups?.length || 0}개`)
      addLog(`  vertices: ${data.vertices}, faces: ${data.faces}`)

      // Step 2: GLB URL 구성
      const glbUrl = `${API}${data.scene_url}`
      addLog(`Step 2: GLB URL = ${glbUrl}`)

      // Step 3: GLB fetch 테스트
      addLog('Step 3: GLB fetch 테스트...')
      const glbRes = await fetch(glbUrl)
      addLog(`  GLB 응답: ${glbRes.status}, size=${glbRes.headers.get('content-length')}`)

      if (glbRes.ok) {
        setSceneUrl(glbUrl)
        addLog('Step 4: sceneUrl 설정 완료 -> 3D 렌더링 시작')
      } else {
        addLog(`  GLB fetch 실패!`)
      }

      // Step 5: /sunlight/upload
      addLog('Step 5: POST /sunlight/upload ...')
      const sunForm = new FormData()
      sunForm.append('obj_file', file)
      const sunRes = await fetch(`${API}/sunlight/upload`, { method: 'POST', body: sunForm })
      addLog(`  응답: ${sunRes.status}`)
      if (sunRes.ok) {
        const sunData = await sunRes.json()
        addLog(`  session_id: ${sunData.session_id}`)
      }

    } catch (err) {
      addLog(`에러: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsUploading(false)
      addLog('--- 업로드 완료 ---')
    }
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-lg font-bold mb-4">Upload + 3D Debug Page</h1>
      <p className="text-xs text-gray-500 mb-4">API: {API}</p>

      <div className="flex gap-4 mb-4">
        <input
          ref={inputRef}
          type="file"
          accept=".obj,.sn5f"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleUpload(f)
          }}
          className="border p-2 text-sm"
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="border px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
        >
          {isUploading ? '업로드 중...' : '파일 선택'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 3D Viewer */}
        <div className="border" style={{ height: '500px' }}>
          {sceneUrl ? (
            <DebugViewer sceneUrl={sceneUrl} onLog={addLog} />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50 text-sm text-gray-400">
              파일을 업로드하면 여기에 3D 모델이 표시됩니다
            </div>
          )}
        </div>

        {/* Log */}
        <div className="border p-3 overflow-y-auto bg-gray-900 text-green-400 text-xs font-mono" style={{ height: '500px' }}>
          {log.length === 0 ? (
            <span className="text-gray-600">로그가 여기에 표시됩니다</span>
          ) : (
            log.map((line, i) => <div key={i}>{line}</div>)
          )}
        </div>
      </div>
    </div>
  )
}
