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
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground tracking-wide uppercase">
            Section Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="e.g. Phase 1: Fundamentals, Core Architecture"
            required
            autoFocus
            className="h-10 text-sm bg-accent/30 focus:bg-background"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground tracking-wide uppercase">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            placeholder="Optional context or milestone goals for this section..."
            rows={3}
            className="w-full rounded-lg border border-input bg-accent/30 focus:bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          />
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="px-4">
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={submitting} className="px-5 shadow-xs">
            {editingSection ? "Update Section" : "Create Section"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default SectionModal