import { cn } from "../../utils/helpers.js"

function Progress({ value = 0, max = 100, className, showLabel = false }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn("relative", className)}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="mt-1 block text-xs text-muted-foreground">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}

export default Progress
