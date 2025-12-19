import { Circle, CheckCircle2, Clock, MoreVertical, Pencil, Trash2 } from "lucide-react"
import Button from "../components/ui/Button.jsx"
import Badge from "../components/ui/Badge.jsx"
import { Dropdown, DropdownItem, DropdownSeparator } from "../components/ui/Dropdown.jsx"
import { STATUS_CONFIG, PRIORITY_CONFIG, ITEM_STATUS } from "../utils/constants.js"
import { formatDuration, cn } from "../utils/helpers.js"

function ItemRow({ item, onToggle, onEdit, onDelete }) {
  const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.todo
  const priorityConfig = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium
  const isCompleted = item.status === ITEM_STATUS.COMPLETED

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border p-3 transition-all hover:bg-accent/50 hover:border-primary/20">
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className="shrink-0 hover:scale-110 transition-transform"
        aria-label={isCompleted ? "Mark as todo" : "Mark as completed"}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
        )}
      </button>

      <div className="flex-1 min-w-0" onClick={onEdit} style={{ cursor: 'pointer' }}>
        <p className={cn("font-medium text-foreground", isCompleted && "line-through text-muted-foreground")}>
          {item.title}
        </p>
        {item.description && <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{item.description}</p>}
      </div>

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
              ? "secondary"
              : "outline"
          }
          className="whitespace-nowrap"
        >
          {priorityConfig.label}
        </Badge>
        <Dropdown
          trigger={
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          }
          align="right"
        >
          <DropdownItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem onClick={onDelete} destructive>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownItem>
        </Dropdown>
      </div>
    </div>
  )
}

export default ItemRow