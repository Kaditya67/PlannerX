import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "../../utils/helpers.js"
import Button from "./Button.jsx"

function Modal({ isOpen, onClose, title, children, className, size = "md" }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[90vw]",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative z-50 w-full rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xl text-card-foreground my-auto",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          sizes[size],
          className,
        )}
      >
        <div className="mb-4 sm:mb-5 flex items-center justify-between pb-3 border-b border-border/60">
          <h2 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg -mr-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default Modal
