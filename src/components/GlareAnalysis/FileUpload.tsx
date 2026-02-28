'use client'

import GenericFileUpload from '@/components/common/GenericFileUpload'

interface FileUploadProps {
  onFilesSelected: (files: FileList) => void
  disabled?: boolean
}

export default function FileUpload({ onFilesSelected, disabled }: FileUploadProps) {
  return (
    <GenericFileUpload
      acceptedExtensions={['.pic', '.hdr', '.tif', '.tiff', '.exr']}
      multiple={true}
      fileTypeLabel="Radiance HDR / TIFF / EXR 이미지 파일"
      onFilesSelected={onFilesSelected}
      disabled={disabled}
      showFileList={true}
      maxDisplayFiles={5}
    />
  )
}
