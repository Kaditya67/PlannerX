import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useToast } from "../context/ToastContext.jsx"
import { planAPI } from "../api/index.js"
import { ArrowLeft } from "lucide-react"
import Button from "../components/ui/Button.jsx"
import { Card, CardContent } from "../components/ui/Card.jsx"
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx"
import Progress from "../components/Progress.jsx"
import Modal from "../components/ui/Modal.jsx"
import Input from "../components/ui/Input.jsx"
import PlanHeader from "../components/PlanHeader.jsx"
import PlanSections from "../components/PlanSections.jsx"
import SectionModal from "../components/SectionModal.jsx"
import ItemModal from "../components/ItemModal.jsx"
import SmartEditor from "../components/SmartEditor.jsx"
import { usePlan } from "../hooks/usePlan.js"
import { formatDuration } from "../utils/helpers.js"

function PlanPage() {
  const { planId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const {
    plan,
    sections,
    items,
    loading,
    collapsedSections,
    sectionModalOpen,
    itemModalOpen,
    editingSection,
    editingItem,
    currentSectionId,
    submitting,
    sectionForm,
    itemForm,
    stats,
    toggleSection,
    openSectionModal,
    openItemModal,
    handleSectionSubmit,
    handleItemSubmit,
    handleToggleItemStatus,
    handleDeleteSection,
    handleDeleteItem,
    setSectionModalOpen,
    setItemModalOpen,
    setSectionForm,
    setItemForm,
    getSectionItems,
    getUnsectionedItems,
    handleUpdateItem,
    handleQuickAddItem
  } = usePlan(planId, toast)
  
  const [smartEditorOpen, setSmartEditorOpen] = useState(false)
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [planSubmitting, setPlanSubmitting] = useState(false)
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6"
  })

  // Open plan modal with current plan data
  const openPlanModal = () => {
    if (plan) {
      setPlanForm({
        name: plan.name || "",
        description: plan.description || "",
        color: plan.color || "#3B82F6"
      })
    }
    setPlanModalOpen(true)
  }

  // Handle plan form submission
  const handlePlanSubmit = async (e) => {
    e.preventDefault()
    setPlanSubmitting(true)

    try {
      const { data } = await planAPI.update(planId, planForm)
      
      // Update local plan state
      if (plan) {
        // Assuming you have a way to update the plan in usePlan hook
        // If not, you might need to refetch or update context
        window.location.reload() // Simple refresh to get updated data
      }
      
      toast.success("Plan updated successfully")
      setPlanModalOpen(false)
    } catch (error) {
      toast.error(error.message || "Failed to update plan")
    } finally {
      setPlanSubmitting(false)
    }
  }

  const handleDownload = () => {
    if (!plan) return
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ plan, sections, items }, null, 2))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `${plan.name.replace(/\s+/g, '_')}_plan.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  const handleSmartImport = async (sectionsToImport) => {
    try {
      await planAPI.importStructure(planId, sectionsToImport)
      toast.success("Plan structure imported")
      window.location.reload()
    } catch (error) {
      toast.error(error.message || "Import failed")
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(`/workspaces/${plan?.workspace?._id || plan?.workspace}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workspace
        </Button>

        <PlanHeader 
          plan={plan} 
          onEditPlan={openPlanModal}
          onAddSection={() => openSectionModal()}
          onDownload={handleDownload}
          onSmartEdit={() => setSmartEditorOpen(true)}
        />

        {/* Progress Card */}
        <Card className="mt-6">
          <CardContent className="flex flex-wrap items-center gap-6 p-6">
            <div className="flex-1 min-w-[250px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
                <span className="text-lg font-bold text-foreground">{stats.progress}%</span>
              </div>
              <Progress value={stats.progress} className="h-3" />
            </div>
            <div className="text-center px-4">
              <p className="text-2xl font-bold text-foreground">{stats.totalItems}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
            <div className="text-center px-4">
              <p className="text-2xl font-bold text-success">{stats.completedItems}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center px-4">
              <p className="text-2xl font-bold text-foreground">{formatDuration(stats.totalDuration)}</p>
              <p className="text-sm text-muted-foreground">Total Time</p>
            </div>
            <div className="text-center px-4">
              <p className="text-2xl font-bold text-success">{formatDuration(stats.completedDuration)}</p>
              <p className="text-sm text-muted-foreground">Completed Time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sections and Items */}
      <PlanSections
        planId={planId}
        sections={sections}
        items={items}
        collapsedSections={collapsedSections}
        onToggleSection={toggleSection}
        onAddSection={openSectionModal}
        onEditSection={openSectionModal}
        onDeleteSection={handleDeleteSection}
        onAddItem={openItemModal}
        onQuickAdd={handleQuickAddItem}
        onToggleItem={handleToggleItemStatus}
        onEditItem={openItemModal}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        getSectionItems={getSectionItems}
        getUnsectionedItems={getUnsectionedItems}
      />

      {/* Section Modal */}
      <SectionModal
        isOpen={sectionModalOpen}
        onClose={() => setSectionModalOpen(false)}
        editingSection={editingSection}
        form={sectionForm}
        onChange={setSectionForm}
        onSubmit={handleSectionSubmit}
        submitting={submitting}
      />

      {/* Item Modal */}
      <ItemModal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        editingItem={editingItem}
        form={itemForm}
        onChange={setItemForm}
        onSubmit={handleItemSubmit}
        submitting={submitting}
        currentSectionId={currentSectionId}
      />



      {/* Smart Editor */}
      <SmartEditor
        isOpen={smartEditorOpen}
        onClose={() => setSmartEditorOpen(false)}
        onImport={handleSmartImport}
        planName={plan?.name}
        initialSections={sections}
        initialItems={items}
      />

      {/* Plan Modal - NEW */}
      <Modal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title="Edit Plan"
      >
        <form onSubmit={handlePlanSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Plan Name *</label>
            <Input
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              placeholder="Plan name"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              placeholder="Optional description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={planForm.color}
                onChange={(e) => setPlanForm({ ...planForm, color: e.target.value })}
                className="h-10 w-10 cursor-pointer rounded border border-input bg-background"
              />
              <span className="text-sm text-muted-foreground">{planForm.color}</span>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={planSubmitting}>
              Update Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default PlanPage