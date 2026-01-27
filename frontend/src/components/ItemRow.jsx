import { Circle, CheckCircle2, Clock, MoreVertical, Pencil, Trash2 } from "lucide-react"
import Button from "../components/ui/Button.jsx"
import Badge from "../components/ui/Badge.jsx"
import { Dropdown, DropdownItem, DropdownSeparator } from "../components/ui/Dropdown.jsx"
import { PRIORITY_CONFIG, ITEM_STATUS } from "../utils/constants.js"
import { formatDuration, cn } from "../utils/helpers.js"

function ItemRow({ item, onToggle, onEdit, onDelete, onUpdate }) {
  const priorityConfig = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium
  const isCompleted = item.status === ITEM_STATUS.COMPLETED

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 transition-all hover:bg-accent/50 hover:border-primary/20">
      
      {/* Toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle(item)
        }}
        className="shrink-0 hover:scale-110 transition-transform"
      >
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
        )}
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(item)}>
        <p className={cn("font-medium", isCompleted && "line-through text-muted-foreground")}>
          {item.title}
        </p>
        {item.description && (
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
            {item.description}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 shrink-0">
        {item.plannedDuration > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {formatDuration(item.plannedDuration)}
          </div>
        )}

        <Badge
          variant={
            item.priority === "high"
              ? "destructive"
              : item.priority === "medium"
              ? "warning"
              : "info"
          }
        >
          {priorityConfig.label}
        </Badge>

        {/* Actions */}
        <Dropdown
          align="right"
          trigger={
            <Button
              variant="ghost"
              size="icon"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          }
        >
          <DropdownItem onClick={() => onEdit(item)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownItem>
          
          <DropdownSeparator />
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Priority</div>
          <DropdownItem onClick={() => onUpdate({ priority: "high" })}>
            <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
            High
          </DropdownItem>
          <DropdownItem onClick={() => onUpdate({ priority: "medium" })}>
            <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2" />
            Medium
          </DropdownItem>
          <DropdownItem onClick={() => onUpdate({ priority: "low" })}>
            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
            Low
          </DropdownItem>

          <DropdownSeparator />
          <DropdownItem onClick={() => onDelete(item)} destructive>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownItem>
        </Dropdown>
      </div>
    </div>
  )
}

export default ItemRow
