import { MoreVertical, Pencil, Trash2 } from "lucide-react"
import Button from "../components/ui/Button.jsx"
import { Dropdown, DropdownItem, DropdownSeparator } from "../components/ui/Dropdown.jsx"

function SectionActions({ section, onEdit, onDelete }) {
  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="icon">
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
  )
}

export default SectionActions