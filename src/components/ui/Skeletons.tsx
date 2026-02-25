export function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-900 rounded-3xl animate-pulse ${className}`} />
}

export function SkeletonText({ width = 'w-full', className = '' }: { width?: string; className?: string }) {
  return <div className={`h-4 bg-gray-800 rounded-lg animate-pulse ${width} ${className}`} />
}

export function SkeletonAvatar({ size = 'w-10 h-10' }: { size?: string }) {
  return <div className={`bg-gray-800 rounded-full animate-pulse ${size}`} />
}

export function DashboardSkeleton() {
  return (
    <div className="px-5 space-y-4 pt-8">
      <SkeletonText width="w-48" className="h-8" />
      <SkeletonCard className="h-40" />
      <SkeletonCard className="h-32" />
      <div className="grid grid-cols-4 gap-2">
        {[1,2,3,4].map(i => <SkeletonCard key={i} className="h-20" />)}
      </div>
      <SkeletonCard className="h-48" />
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="px-5 space-y-4 pt-8">
      <div className="flex items-center gap-4">
        <SkeletonAvatar size="w-20 h-20" />
        <div className="flex-1 space-y-2">
          <SkeletonText width="w-32" className="h-6" />
          <SkeletonText width="w-24" />
        </div>
      </div>
      <SkeletonCard className="h-24" />
      <SkeletonCard className="h-48" />
    </div>
  )
}

export function WorkoutSkeleton() {
  return (
    <div className="px-5 space-y-4 pt-8">
      <SkeletonText width="w-48" className="h-8" />
      {[1,2,3,4].map(i => (
        <SkeletonCard key={i} className="h-24" />
      ))}
    </div>
  )
}

export function NutritionSkeleton() {
  return (
    <div className="px-5 space-y-4 pt-8">
      <SkeletonCard className="h-32" />
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3].map(i => <SkeletonCard key={i} className="h-16" />)}
      </div>
      <SkeletonCard className="h-48" />
    </div>
  )
}
