import { useCallback } from 'react'
import type { UsePrivacyPipelineReturn } from '@/components/PrivacyAnalysis/hooks/usePrivacyPipeline'

/**
 * 단일 OBJ 파일을 target + observer 양쪽에 전송하는 어댑터.
 * 기존 usePrivacyPipeline.upload(target, observer)은 2개 파일을 받지만,
 * 워크스페이스에서는 같은 대지 모델 하나를 공유하므로 동일 파일을 양쪽에 전달.
 */
export function usePrivacySingleUpload(pipeline: UsePrivacyPipelineReturn) {
  const uploadSingle = useCallback(
    async (file: File) => {
      await pipeline.upload(file, file)
    },
    [pipeline]
  )

  return {
    ...pipeline,
    uploadSingle,
  }
}
