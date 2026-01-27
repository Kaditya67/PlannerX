import { cn } from "../../utils/helpers"

export function ScrollArea({ className, children, ...props }) {
  return (
    <div
      className={cn("relative overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  )
}
