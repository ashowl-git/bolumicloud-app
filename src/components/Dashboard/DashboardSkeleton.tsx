'use client'

import Skeleton from '@/components/common/Skeleton'

export default function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      {/* Branding skeleton */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton variant="circle" width="32px" />
          <Skeleton variant="custom" width="160px" height="28px" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton variant="text" width="260px" />
          <Skeleton variant="circle" width="6px" />
          <Skeleton variant="text" width="60px" />
        </div>
      </div>

      {/* Section skeletons (2 sections) */}
      {[0, 1].map((sectionIdx) => (
        <div key={sectionIdx} className="mb-10">
          {/* Section header */}
          <div className="flex items-center gap-2 mb-4">
            <Skeleton variant="custom" width="16px" height="16px" />
            <Skeleton variant="text" width="80px" height="12px" />
            <div className="flex-1 h-px bg-gray-100 ml-2" />
          </div>
          {/* Card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((cardIdx) => (
              <div key={cardIdx} className="border border-gray-200 p-6">
                <Skeleton variant="custom" width="28px" height="28px" className="mb-3" />
                <Skeleton variant="text" width="60%" height="14px" className="mb-2" />
                <Skeleton variant="text" lines={2} height="12px" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
