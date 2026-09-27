import Modal from "./ui/Modal.jsx"
import Button from "./ui/Button.jsx"
import Input from "./ui/Input.jsx"

function SectionModal({
  isOpen,
  onClose,
  editingSection,
  form,
  onChange,
  onSubmit,
  submitting
}) {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(e)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSection ? "Edit Section" : "Add Section"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Name *</label>
          <Input
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="Section name"
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
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {editingSection ? "Update Section" : "Create Section"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default SectionModal