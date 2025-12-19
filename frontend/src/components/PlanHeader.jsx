import Button from "../components/ui/Button.jsx"
import { Pencil, Plus } from "lucide-react"

function PlanHeader({ plan, onEditPlan, onAddSection }) {
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
        <Button onClick={onAddSection}>
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </div>
    </div>
  )
}

export default PlanHeader