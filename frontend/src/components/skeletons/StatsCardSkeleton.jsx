export default function StatsCardSkeleton({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 rounded bg-muted w-1/2" />
                <div className="h-8 rounded bg-muted w-3/4" />
              </div>
              <div className="rounded-full bg-muted p-3">
                <div className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="h-3 rounded bg-muted w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
