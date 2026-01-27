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
  currentSectionId,
}) {
  const handleSubmit = (e) => {
    onSubmit(e)
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingItem ? "Edit Item" : "Add Item"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Title *</label>
          <Input
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            placeholder="Item title"
            required
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={form.description}
            onChange={(e) =>
              onChange({ ...form, description: e.target.value })
            }
            placeholder="Optional description"
            className="min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Priority + Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <select
              value={form.priority}
              onChange={(e) =>
                onChange({ ...form, priority: e.target.value })
              }
              className="h-10 w-full rounded-md border px-3 text-sm"
            >
              {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Duration (minutes)</label>
            <Input
              type="number"
              value={form.plannedDuration}
              min={0}
              step={5}
              onChange={(e) =>
                onChange({
                  ...form,
                  plannedDuration: Number(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
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
