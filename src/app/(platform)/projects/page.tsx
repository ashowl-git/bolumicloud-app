'use client'

import ProjectList from '@/components/Projects/ProjectList'

export default function ProjectsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">내 프로젝트</h1>
        <p className="text-sm text-gray-500 mt-1">이전 분석 세션을 확인하고 결과를 다시 볼 수 있습니다.</p>
      </div>
      <ProjectList />
    </div>
  )
}
