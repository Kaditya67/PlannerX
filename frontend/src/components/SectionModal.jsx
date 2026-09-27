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
        <div>
          <label className="block text-xs font-medium text-foreground/80 mb-2">
            Section Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="e.g. Planning & Research"
            required
            autoFocus
            className="h-9 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground/80 mb-2">
            Description <span className="text-[11px] text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            placeholder="Short note about this section..."
            rows={2}
            className="w-full rounded-lg border border-input bg-card p-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="px-3.5">
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={submitting} className="px-4">
            {editingSection ? "Save Changes" : "Add Section"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default SectionModal