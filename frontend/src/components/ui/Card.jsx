import { cn } from "../../utils/helpers.js"

function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "relative rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* --------------------------------------------
   Header
--------------------------------------------- */
function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 px-6 py-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold leading-tight tracking-tight text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn(
        "text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

/* --------------------------------------------
   Content
--------------------------------------------- */
function CardContent({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "px-6 pb-6 pt-2",   // 👈 key fix: restore top spacing
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* --------------------------------------------
   Footer
--------------------------------------------- */
function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-t px-6 py-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
}
