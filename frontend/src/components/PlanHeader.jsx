import Button from "../components/ui/Button.jsx"
import { Pencil, Plus, FileText } from "lucide-react"

function PlanHeader({ plan, onEditPlan, onAddSection, onDownload, onSmartEdit }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: plan?.color || "#3B82F6" }} />
          <h1 className="text-3xl font-bold text-foreground">{plan?.name}</h1>
        </div>
        {plan?.description && <p className="mt-2 text-muted-foreground">{plan.description}</p>}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onEditPlan}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Plan
        </Button>
        <Button variant="outline" onClick={onDownload}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-4 w-4"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
          Download
        </Button>
        <Button variant="outline" onClick={onSmartEdit}>
          <FileText className="mr-2 h-4 w-4" />
          Smart Edit
        </Button>
        <Button onClick={onAddSection}>
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </div>
    </div>
  )
}

export default PlanHeader