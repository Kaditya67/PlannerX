import Modal from "../components/ui/Modal.jsx"
import Button from "../components/ui/Button.jsx"
import Input from "../components/ui/Input.jsx"
import { PRIORITY_CONFIG } from "../utils/constants.js"

function ItemModal({
  isOpen,
  onClose,
  editingItem,
  form,
  onChange,
  onSubmit,
  submitting,
  currentSectionId
}) {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(e)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? "Edit Item" : "Add Item"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Title *</label>
          <Input
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            placeholder="Item title"
            required
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            placeholder="Optional description"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => onChange({ ...form, priority: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Duration (minutes)</label>
            <Input
              type="number"
              value={form.plannedDuration}
              onChange={(e) => onChange({ ...form, plannedDuration: Number.parseInt(e.target.value) || 0 })}
              min={0}
              step={5}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {editingItem ? "Update Item" : "Create Item"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ItemModal