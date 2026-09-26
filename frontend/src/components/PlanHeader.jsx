import Button from "./ui/Button.jsx"
import Badge from "./ui/Badge.jsx"
import { Dropdown, DropdownItem, DropdownSeparator } from "./ui/Dropdown.jsx"
import {
  Pencil,
  Plus,
  FileText,
  Archive,
  Bookmark,
  RotateCcw,
  Download,
  MoreVertical,
} from "lucide-react"

function PlanHeader({ plan, onEditPlan, onAddSection, onDownload, onSmartEdit, onUpdateStatus }) {
  const status = plan?.status || "active"

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: plan?.color || "#3B82F6" }} />
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{plan?.name}</h1>
          {status === "archived" && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              Archived
            </Badge>
          )}
          {status === "stashed" && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              Stashed
            </Badge>
          )}
        </div>
        {plan?.description && <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>}
      </div>

      {/* Action Bar: Primary Action + Grouped Dropdown Box */}
      <div className="flex items-center gap-2 self-start">
        <Button size="sm" onClick={onAddSection} className="shadow-sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Section
        </Button>

        <Dropdown
          align="right"
          className="w-48"
          trigger={
            <Button variant="outline" size="sm" className="px-2.5" title="Plan options">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
          }
        >
          <DropdownItem onClick={onEditPlan}>
            <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
            Edit Plan Details
          </DropdownItem>
          <DropdownItem onClick={onSmartEdit}>
            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
            Smart Edit
          </DropdownItem>
          <DropdownItem onClick={onDownload}>
            <Download className="mr-2 h-4 w-4 text-muted-foreground" />
            Export Plan
          </DropdownItem>

          <DropdownSeparator />

          {status === "active" ? (
            <>
              <DropdownItem onClick={() => onUpdateStatus("stashed")}>
                <Bookmark className="mr-2 h-4 w-4 text-purple-500" />
                Stash Plan
              </DropdownItem>
              <DropdownItem onClick={() => onUpdateStatus("archived")}>
                <Archive className="mr-2 h-4 w-4 text-amber-500" />
                Archive Plan
              </DropdownItem>
            </>
          ) : (
            <DropdownItem onClick={() => onUpdateStatus("active")} className="text-emerald-600 dark:text-emerald-400 font-medium">
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore to Active
            </DropdownItem>
          )}
        </Dropdown>
      </div>
    </div>
  )
}

export default PlanHeader
