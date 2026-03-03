'use client'

import { motion } from 'framer-motion'
import { useLocalizedText } from '@/hooks/useLocalizedText'
import UnifiedFileDropZone from '@/components/Pipeline/UnifiedFileDropZone'
import FileTypeChecklist from '@/components/Pipeline/FileTypeChecklist'
import type { LocalizedText } from '@/lib/types/i18n'

const txt = {
  uploadBtn: { ko: '파일 업로드', en: 'Upload Files' } as LocalizedText,
  uploading: { ko: '업로드 중...', en: 'Uploading...' } as LocalizedText,
}

const fadeVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

interface UploadStepProps {
  vfFiles: File[]
  objFile: File | null
  mtlFile: File | null
  isUploading: boolean
  sessionId: string | null
  canUpload: boolean
  onFilesClassified: (files: { vfFiles: File[]; obj: File | null; mtl: File | null }) => void
  onRemoveVf: (idx: number) => void
  onUpload: () => void
}

export default function UploadStep({
  vfFiles,
  objFile,
  mtlFile,
  isUploading,
  sessionId,
  canUpload,
  onFilesClassified,
  onRemoveVf,
  onUpload,
}: UploadStepProps) {
  const { t } = useLocalizedText()

  return (
    <motion.div
      key="step-1"
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <UnifiedFileDropZone
        onFilesClassified={onFilesClassified}
        currentFiles={{ vfFiles, obj: objFile, mtl: mtlFile }}
        disabled={isUploading || !!sessionId}
        isProcessing={isUploading}
      />

      <FileTypeChecklist
        vfFiles={vfFiles}
        objFile={objFile}
        mtlFile={mtlFile}
        onRemoveVf={!sessionId ? onRemoveVf : undefined}
      />

      {canUpload && !sessionId && (
        <div className="pt-2">
          <button
            onClick={onUpload}
            disabled={isUploading}
            className="border border-gray-200 hover:border-red-600/30 px-8 py-3
              text-gray-900 hover:text-red-600 transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? t(txt.uploading) : t(txt.uploadBtn)}
          </button>
        </div>
      )}
    </motion.div>
  )
}
