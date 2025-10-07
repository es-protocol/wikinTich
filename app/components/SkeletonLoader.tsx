/**
 * Skeleton Loading Components
 * Used to show loading states while data is being fetched
 * Improves perceived performance on slow/unstable networks
 */

interface SkeletonProps {
  className?: string
}

export const SkeletonBox = ({ className = '' }: SkeletonProps) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
)

export const SkeletonText = ({ className = '' }: SkeletonProps) => (
  <div className={`animate-pulse bg-gray-200 rounded h-4 ${className}`} />
)

export const SkeletonCircle = ({ className = '' }: SkeletonProps) => (
  <div className={`animate-pulse bg-gray-200 rounded-full ${className}`} />
)

// Skeleton for profile header
export const ProfileHeaderSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
    <div className="flex items-center gap-4">
      <SkeletonCircle className="w-16 h-16" />
      <div className="flex-1 space-y-3">
        <SkeletonText className="w-48 h-6" />
        <SkeletonText className="w-64 h-4" />
      </div>
    </div>
  </div>
)

// Skeleton for student card
export const StudentCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-md p-4 border-2 border-gray-200">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 space-y-2">
        <SkeletonText className="w-32 h-5" />
        <SkeletonText className="w-24 h-4" />
      </div>
      <SkeletonCircle className="w-8 h-8" />
    </div>
    <div className="space-y-2">
      <SkeletonText className="w-full h-3" />
      <SkeletonText className="w-3/4 h-3" />
    </div>
  </div>
)

// Skeleton for session card
export const SessionCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-300">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 space-y-2">
        <SkeletonText className="w-40 h-5" />
        <SkeletonText className="w-32 h-4" />
      </div>
      <SkeletonBox className="w-20 h-6 rounded-full" />
    </div>
    <div className="space-y-2 mt-3">
      <SkeletonText className="w-full h-3" />
      <SkeletonText className="w-2/3 h-3" />
    </div>
  </div>
)

// Skeleton for request card
export const RequestCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-4">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 space-y-2">
        <SkeletonText className="w-48 h-5" />
        <SkeletonText className="w-36 h-4" />
      </div>
      <SkeletonBox className="w-24 h-6 rounded-full" />
    </div>
    <div className="space-y-2 mt-3">
      <SkeletonText className="w-full h-3" />
      <SkeletonText className="w-full h-3" />
      <SkeletonText className="w-1/2 h-3" />
    </div>
  </div>
)

// Skeleton for stat card
export const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <div className="flex items-center gap-4">
      <SkeletonCircle className="w-12 h-12" />
      <div className="flex-1 space-y-2">
        <SkeletonText className="w-16 h-8" />
        <SkeletonText className="w-32 h-4" />
      </div>
    </div>
  </div>
)

// Skeleton for table row
export const TableRowSkeleton = () => (
  <tr className="border-b border-gray-200">
    <td className="px-4 py-3"><SkeletonText className="w-32" /></td>
    <td className="px-4 py-3"><SkeletonText className="w-24" /></td>
    <td className="px-4 py-3"><SkeletonText className="w-40" /></td>
    <td className="px-4 py-3"><SkeletonText className="w-20" /></td>
  </tr>
)

// Full section skeleton with title
export const SectionSkeleton = ({ title }: { title: string }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
    <div className="space-y-4">
      <SkeletonBox className="w-full h-24" />
      <SkeletonBox className="w-full h-24" />
      <SkeletonBox className="w-full h-24" />
    </div>
  </div>
)

// Empty state component
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionButton 
}: { 
  icon: any
  title: string
  description: string
  actionButton?: React.ReactNode 
}) => (
  <div className="text-center py-12">
    <Icon className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-semibold text-gray-900">{title}</h3>
    <p className="mt-1 text-sm text-gray-500">{description}</p>
    {actionButton && <div className="mt-6">{actionButton}</div>}
  </div>
)

