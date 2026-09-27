import { Layers } from "lucide-react"
import { cn } from "../../utils/helpers.js"

export default function LoadingScreen({ message = "Loading Planner...", fullScreen = true, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-200 select-none",
        fullScreen ? "fixed inset-0 z-50 h-screen w-screen" : "h-full w-full min-h-[300px] p-8",
        className
      )}
      role="status"
      aria-label="Loading application"
    >
      {/* Brand Logo Container with Breathing Glow */}
      <div className="relative flex items-center justify-center">
        {/* Soft pulse glow ring in background */}
        <div className="absolute h-16 w-16 rounded-2xl bg-emerald-500/20 dark:bg-emerald-400/15 animate-ping" />
        
        {/* Logo badge with emerald gradient & pulse */}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 dark:bg-emerald-500 shadow-lg shadow-emerald-500/25 dark:shadow-emerald-900/40 animate-pulse">
          <Layers className="h-7 w-7 text-white" />
        </div>
      </div>

      {/* Brand title + animated loader bar */}
      <div className="mt-5 flex flex-col items-center gap-2">
        <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Planner
        </span>
        {message && (
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {message}
          </p>
        )}

        {/* Smooth indeterminate progress track */}
        <div className="mt-2 h-1 w-28 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div className="h-full w-full bg-emerald-600 dark:bg-emerald-500 origin-left animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  )
}
