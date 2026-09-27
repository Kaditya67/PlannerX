import { Layers } from "lucide-react"
import { cn } from "../../utils/helpers.js"

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-14 w-14 border-[3px]",
}

function LoadingSpinner({ size = "md", className, showLogo = false }) {
  // If size is lg or showLogo is explicitly true, render the branded Planner logo spinner
  if (size === "lg" || showLogo) {
    return (
      <div className={cn("relative flex items-center justify-center select-none", className)} role="status" aria-label="Loading">
        {/* Spinning track ring */}
        <div className="h-14 w-14 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-600 dark:border-emerald-400/20 dark:border-t-emerald-400" />
        
        {/* Centered Planner logo badge */}
        <div className="absolute flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 dark:bg-emerald-500 shadow-sm animate-pulse">
          <Layers className="h-4.5 w-4.5 text-white" />
        </div>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "animate-spin rounded-full",
        "border border-primary/30 border-t-primary",
        sizes[size],
        className
      )}
    />
  )
}

export default LoadingSpinner

