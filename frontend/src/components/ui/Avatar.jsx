import { cn, getInitials } from "../../utils/helpers.js"

function Avatar({ src, name, size = "md", className }) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  }

  if (src) {
    return (
      <img
        src={src || "/placeholder.svg"}
        alt={name || "Avatar"}
        className={cn(
          "rounded-full object-cover",
          sizes[size],
          className
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-muted text-foreground font-medium",
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}

export default Avatar
