import { useState, useRef, useEffect } from "react"
import { Plus, Loader2 } from "lucide-react"
import Button from "./ui/Button.jsx"
import Input from "./ui/Input.jsx"

// QuickEntry component for fast item addition
function QuickEntry({ onAdd, placeholder = "Add new item...", autoFocus = false, className = "" }) {
  const [isAdding, setIsAdding] = useState(false)
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isAdding && autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAdding, autoFocus])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!value.trim()) return

    try {
      setLoading(true)
      await onAdd(value)
      setValue("")
      // Keep focus for creating multiple items
      if (inputRef.current) inputRef.current.focus()
    } catch (error) {
      console.error("Failed to add item", error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsAdding(false)
      setValue("")
    }
  }

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={`w-full justify-start text-muted-foreground hover:text-foreground ${className}`}
        onClick={() => setIsAdding(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        {placeholder}
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={loading}
        className="h-9"
        autoComplete="off"
      />
      <Button type="submit" size="sm" disabled={loading || !value.trim()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsAdding(false)}
        disabled={loading}
      >
        Cancel
      </Button>
    </form>
  )
}

export default QuickEntry
