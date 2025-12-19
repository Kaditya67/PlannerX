import { useState, useRef, useEffect } from "react"
import { cn } from "../../utils/helpers.js"

function Dropdown({ trigger, children, align = "left", className }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(v => !v)}>{trigger}</div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-[8rem] rounded-md border p-1 shadow-md",
            "bg-card text-card-foreground border-border",
            "animate-in fade-in-0 zoom-in-95",
            align === "right" ? "right-0" : "left-0",
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

function DropdownItem({ children, onClick, className, destructive = false }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-sm px-2 py-1.5 text-sm",
        "text-foreground hover:bg-accent",
        destructive && "text-destructive hover:bg-destructive/10",
        className
      )}
    >
      {children}
    </button>
  )
}

function DropdownSeparator() {
  return <div className="-mx-1 my-1 h-px bg-border" />
}

export { Dropdown, DropdownItem, DropdownSeparator }
