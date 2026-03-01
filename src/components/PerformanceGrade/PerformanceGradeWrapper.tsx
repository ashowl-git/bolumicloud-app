'use client'

import { useApi } from '@/contexts/ApiContext'
import { PerformanceGradeProvider } from '@/contexts/PerformanceGradeContext'
import PerformanceGradeTab from './PerformanceGradeTab'

export default function PerformanceGradeWrapper() {
  const { apiUrl } = useApi()

  return (
    <PerformanceGradeProvider apiUrl={apiUrl}>
      <PerformanceGradeTab />
    </PerformanceGradeProvider>
  )
}
