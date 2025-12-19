import { cn } from "../utils/helpers.js"

function Progress({ value, className, ...props }) {
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className="h-full w-full flex-1 bg-primary transition-all duration-300 ease-out"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        {...props}
      />
    </div>
  )
}

export default Progress