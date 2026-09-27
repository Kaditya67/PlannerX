import Modal from "./ui/Modal.jsx"
import Button from "./ui/Button.jsx"
import Input from "./ui/Input.jsx"
import { Clock, AlertCircle } from "lucide-react"

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", activeColor: "border-gray-400 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  { value: "medium", label: "Medium", activeColor: "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
  { value: "high", label: "High", activeColor: "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  { value: "urgent", label: "Urgent", activeColor: "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" },
]

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
      title={editingItem ? "Edit Task Item" : "Create New Task"}
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground tracking-wide uppercase">
            Title <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
            placeholder="e.g. Design wireframes, Implement authentication"
            required
            autoFocus
            className="h-10 text-sm bg-accent/30 focus:bg-background"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground tracking-wide uppercase">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              onChange({ ...form, description: e.target.value })
            }
            placeholder="Optional context, checklist or sub-steps..."
            rows={3}
            className="w-full rounded-lg border border-input bg-accent/30 focus:bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          />
        </div>

        {/* Priority Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground tracking-wide uppercase">
            Priority
          </label>
          <div className="grid grid-cols-4 gap-2">
            {PRIORITY_OPTIONS.map((p) => {
              const isSelected = form.priority === p.value
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onChange({ ...form, priority: p.value })}
                  className={`h-9 rounded-lg border text-xs font-medium transition-all ${
                    isSelected
                      ? `${p.activeColor} shadow-2xs font-semibold ring-1 ring-current`
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground tracking-wide uppercase flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Estimated Duration
            </label>
            <span className="text-xs text-muted-foreground font-medium">
              {form.plannedDuration >= 60
                ? `${Math.floor(form.plannedDuration / 60)}h ${form.plannedDuration % 60 ? (form.plannedDuration % 60) + 'm' : ''}`
                : `${form.plannedDuration || 0}m`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={form.plannedDuration}
              min={0}
              step={5}
              onChange={(e) =>
                onChange({
                  ...form,
                  plannedDuration: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="h-9 text-sm bg-accent/30 focus:bg-background flex-1"
            />
            <div className="flex items-center gap-1 shrink-0">
              {[15, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onChange({ ...form, plannedDuration: mins })}
                  className={`h-8 px-2 rounded-md border text-[11px] font-medium transition-colors ${
                    form.plannedDuration === mins
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-semibold"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
          <Button type="button" variant="outline" size="sm" onClick={handleClose} className="px-4">
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={submitting} className="px-5 shadow-xs">
            {editingItem ? "Update Item" : "Create Item"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ItemModal
