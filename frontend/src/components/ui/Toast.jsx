import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "../../utils/helpers.js"

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const accentStyles = {
  success: "border-l-emerald-500",
  error: "border-l-red-500",
  warning: "border-l-amber-500",
  info: "border-l-sky-500",
}

function Toast({ type = "info", message, onClose }) {
  const Icon = icons[type]

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border-l-4 px-4 py-3 shadow-lg",
        "bg-card text-card-foreground",
        "animate-in slide-in-from-right-full duration-300",
        accentStyles[type],
      )}
    >
      <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-auto shrink-0 text-muted-foreground hover:opacity-80">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default Toast
