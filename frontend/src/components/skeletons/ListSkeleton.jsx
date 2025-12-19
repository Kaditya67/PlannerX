export default function ListSkeleton({ count = 4, variant = "default" }) {
  const isCompact = variant === "compact"

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse"
          style={{ animationDelay: `${index * 0.08}s` }}
        >
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <div className="flex-shrink-0">
              <div className="h-3 w-3 rounded-full bg-muted" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="h-4 rounded bg-muted w-3/4" />
              <div className="h-3 rounded bg-muted w-1/2" />
            </div>

            {!isCompact && (
              <div className="flex-shrink-0">
                <div className="h-8 w-20 rounded-full bg-muted" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
