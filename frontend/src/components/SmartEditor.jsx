import { useState, useEffect } from "react"
import { Loader2, FileText, CheckCircle, ArrowRight, Info } from "lucide-react"
import Button from "./ui/Button.jsx"
import { Card, CardContent } from "./ui/Card.jsx"
import { ScrollArea } from "./ui/ScrollArea.jsx"
import { PRIORITY_CONFIG } from "../utils/constants.js"
import Modal from "./ui/Modal.jsx"

// Helper to parse duration string (e.g. "1h 30m") to minutes
const parseDurationString = (str) => {
  if (!str) return 60
  let minutes = 0
  const hoursMatch = str.match(/(\d+)h/)
  const minutesMatch = str.match(/(\d+)m/)
  if (hoursMatch) minutes += parseInt(hoursMatch[1]) * 60
  if (minutesMatch) minutes += parseInt(minutesMatch[1])
  return minutes || 60
}

// Helper to format minutes to string (e.g. 90 -> "1h 30m")
const formatDurationString = (mins) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function SmartEditor({ isOpen, onClose, onImport, planName, initialSections = [], initialItems = [] }) {
  const [text, setText] = useState("")
  const [preview, setPreview] = useState([])
  const [loading, setLoading] = useState(false)

  // Example template
  const TEMPLATE = `# Phase 1: Foundation
- [ ] Setup project repository [High]
  Create the git repo and set up .gitignore
- [x] Initialize database (30m)
- Configure authentication

# Phase 2: Core Features
- Implement user profile`

  useEffect(() => {
    if (isOpen) {
      if (initialSections.length > 0 || initialItems.length > 0) {
        // Reverse parse existing plan to markdown
        const lines = []
        
        // Handle unsectioned items first
        const unsectioned = initialItems.filter(i => !i.section)
        if (unsectioned.length > 0) {
           unsectioned.forEach(item => {
             lines.push(formatItemLine(item))
             if (item.description) {
               lines.push(`  ${item.description.replace(/\n/g, "\n  ")}`)
             }
           })
           lines.push("")
        }

        // Handle sections
        initialSections.forEach(section => {
          lines.push(`# ${section.name}`)
          const sectionItems = initialItems.filter(i => i.section === section._id)
          sectionItems.forEach(item => {
            lines.push(formatItemLine(item))
            if (item.description) {
              lines.push(`  ${item.description.replace(/\n/g, "\n  ")}`)
            }
          })
          lines.push("")
        })
        
        setText(lines.join("\n"))
      } else if (!text) {
        setText(TEMPLATE)
      }
    }
  }, [isOpen])

  const formatItemLine = (item) => {
    // Add checkmark if completed
    const prefix = item.status === 'completed' ? '- [x] ' : '- '
    let line = `${prefix}${item.title}`
    
    // Add Priority if not medium
    if (item.priority && item.priority !== 'medium') {
      line += ` [${item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}]`
    }
    
    // Add Duration if not default (60)
    if (item.plannedDuration && item.plannedDuration !== 60) {
      line += ` (${formatDurationString(item.plannedDuration)})`
    }
    
    return line
  }

  // Parse text to structure
  useEffect(() => {
    const lines = text.split("\n")
    const structure = []
    let currentSection = null
    let lastItem = null

    lines.forEach((line) => {
      // Preserve leading whitespace for description detection
      const trimmed = line.trim()
      
      if (!trimmed) return

      if (line.startsWith("#")) {
        // New Section
        if (currentSection) {
          structure.push(currentSection)
        }
        currentSection = {
          name: trimmed.replace(/^#+\s*/, ""),
          items: []
        }
        lastItem = null
      } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        // New Item
        let rawContent = trimmed
        let status = "todo"
        
        // Check for completed status [x]
        if (rawContent.match(/^[-*]\s*\[x\]/i)) {
          status = "completed"
          rawContent = rawContent.replace(/^[-*]\s*\[x\]\s*/i, "")
        } else {
          // Normal bullet or empty checkbox
          rawContent = rawContent.replace(/^[-*]\s*(\[\s*\]\s*)?/, "")
        }
        
        // Extract Priority: [High], [Medium], [Low]
        let priority = "medium"
        const priorityMatch = rawContent.match(/\[(High|Medium|Low)\]/i)
        if (priorityMatch) {
          priority = priorityMatch[1].toLowerCase()
          rawContent = rawContent.replace(priorityMatch[0], "").trim()
        }

        // Extract Duration: (30m), (1h), (1h 30m)
        let duration = 60
        const durationMatch = rawContent.match(/\(([\d\w\s]+)\)/)
        if (durationMatch) {
          duration = parseDurationString(durationMatch[1])
          rawContent = rawContent.replace(durationMatch[0], "").trim()
        }

        const itemData = { 
          title: rawContent,
          status,
          priority,
          plannedDuration: duration,
          description: ""
        }

        if (currentSection) {
          currentSection.items.push(itemData)
        } else {
          // Unsectioned/General bucket
          if (!currentSection) {
             currentSection = { name: "General", items: [] }
          }
           currentSection.items.push(itemData)
        }
        lastItem = itemData
      } else if (lastItem && (line.startsWith("  ") || line.startsWith("\t"))) {
        // Description line (must be indented)
        // Add newline if it's not the first line of description
        if (lastItem.description) {
          lastItem.description += "\n" + trimmed
        } else {
          lastItem.description = trimmed
        }
      }
    })

    if (currentSection) {
      structure.push(currentSection)
    }

    setPreview(structure)
  }, [text])

  const handleImport = async () => {
    if (preview.length === 0) return

    try {
      setLoading(true)
      await onImport(preview)
      onClose()
      setText(TEMPLATE) // Reset
    } catch (error) {
      console.error("Import failed", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Smart Plan Editor" 
      size="xl"
      className="h-[80vh] flex flex-col p-0 overflow-hidden"
    >
      <div className="flex flex-1 h-full overflow-hidden">
        
        {/* Editor Column */}
        <div className="flex-1 flex flex-col border-r h-full min-w-0">
          <div className="bg-muted/10 border-b px-4 py-2 text-xs text-muted-foreground flex justify-between items-center">
            <span className="font-semibold text-foreground">Markdown Input</span>
            <div className="flex gap-2 opacity-80">
               <span># Section</span>
               <span>- [x] Item</span>
               <span>(30m)</span>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 w-full resize-none bg-background p-4 font-mono text-sm focus:outline-none leading-relaxed"
            placeholder="Type your plan here..."
            autoFocus
          />
        </div>

        {/* Preview Column */}
        <div className="flex-1 flex flex-col bg-muted/30 h-full min-w-0">
          <div className="bg-muted/10 border-b px-4 py-2 text-xs text-muted-foreground flex justify-between items-center">
            <span className="font-semibold text-foreground">Live Preview</span>
            <span>{preview.length} Sections, {preview.reduce((acc, s) => acc + s.items.length, 0)} Items</span>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {preview.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground space-y-2">
                  <FileText className="h-8 w-8 opacity-20" />
                  <span className="italic">Type on the left to see preview...</span>
                </div>
              ) : (
                preview.map((section, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="font-semibold text-primary border-b border-border/50 pb-1">{section.name}</h4>
                    <ul className="ml-2 space-y-3">
                      {section.items.map((item, iIdx) => (
                        <li key={iIdx} className="text-sm group">
                          <div className="flex items-start gap-2 text-foreground">
                             <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                                item.priority === 'high' ? 'bg-red-500' : 
                                item.priority === 'low' ? 'bg-blue-500' : 'bg-yellow-500'
                            }`} />
                            <div className="flex-1 space-y-0.5">
                                <div className={`flex items-baseline gap-2 font-medium ${item.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                    {item.title}
                                    {item.plannedDuration !== 60 && (
                                        <span className="text-xs text-muted-foreground font-normal no-underline">
                                            ({formatDurationString(item.plannedDuration)})
                                        </span>
                                    )}
                                </div>
                                {item.description && (
                                    <p className="text-xs text-muted-foreground whitespace-pre-line pl-0 border-l-2 border-muted pl-2">
                                    {item.description}
                                    </p>
                                )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="border-t p-4 bg-background flex justify-end gap-2 shrink-0">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleImport} disabled={loading || preview.length === 0}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          Sync Plan
        </Button>
      </div>
    </Modal>
  )
}

export default SmartEditor
