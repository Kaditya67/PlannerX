import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useToast } from "../context/ToastContext.jsx"
import { planAPI } from "../api/index.js"
import { ArrowLeft, Copy, Check, Download, Share2, Plus, Folder, BookOpen, Calendar, Sun, Layers } from "lucide-react"
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
import { formatDuration, generateColor } from "../utils/helpers.js"
import { PLAN_TYPES, PLAN_TYPE_LABELS } from "../utils/constants.js"

const PLAN_TYPE_ICONS = {
  project: Folder,
  study: BookOpen,
  event: Calendar,
  daily: Sun,
  free: Layers,
}

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
  const [createPlanModalOpen, setCreatePlanModalOpen] = useState(false)
  const [createPlanSubmitting, setCreatePlanSubmitting] = useState(false)
  const [newPlanForm, setNewPlanForm] = useState({
    name: "",
    description: "",
    type: PLAN_TYPES.PROJECT,
    color: generateColor(),
  })
  const [showStats, setShowStats] = useState(() => {
    return localStorage.getItem("planner_show_plan_stats") === "true" // hidden by default!
  })
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6"
  })

  const openCreatePlanModal = () => {
    setNewPlanForm({
      name: "",
      description: "",
      type: PLAN_TYPES.PROJECT,
      color: generateColor(),
    })
    setCreatePlanModalOpen(true)
  }

  const handleCreateNewPlan = async (e) => {
    e.preventDefault()
    setCreatePlanSubmitting(true)

    try {
      const workspaceId = plan?.workspace?._id || plan?.workspace
      const { data } = await planAPI.create({ ...newPlanForm, workspace: workspaceId })
      toast.success("New plan created!")
      setCreatePlanModalOpen(false)
      navigate(`/plans/${data._id}`)
    } catch (error) {
      toast.error(error.message || "Failed to create plan")
    } finally {
      setCreatePlanSubmitting(false)
    }
  }

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

  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [templateData, setTemplateData] = useState(null)
  const [templateLoading, setTemplateLoading] = useState(false)

  const handleShareTemplate = async () => {
    try {
      setTemplateLoading(true)
      const res = await planAPI.getTemplate(planId)
      const cleanTemplate = res.data?.data || res.data
      setTemplateData(cleanTemplate)
      setShareModalOpen(true)
    } catch (error) {
      toast.error(error.message || "Failed to generate template")
    } finally {
      setTemplateLoading(false)
    }
  }

  const handleCopyTemplate = async () => {
    try {
      const res = await planAPI.getTemplate(planId)
      const cleanTemplate = res.data?.data || res.data
      await navigator.clipboard.writeText(JSON.stringify(cleanTemplate, null, 2))
      toast.success("Fresh template JSON copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy template JSON")
    }
  }

  const handleDownloadTemplate = () => {
    if (!templateData) return
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templateData, null, 2))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `${(templateData.name || 'template').replace(/\s+/g, '_')}.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
    toast.success("Fresh template file exported!")
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

  const handleUpdateStatus = async (newStatus) => {
    try {
      await planAPI.update(planId, { status: newStatus })
      toast.success(`Plan marked as ${newStatus}`)
      window.location.reload()
    } catch (error) {
      toast.error(error.message || "Failed to update status")
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <h2 className="text-xl font-bold text-foreground">Plan not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The requested plan could not be loaded or may have been deleted.</p>
        <Button className="mt-4" onClick={() => navigate("/workspaces")}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Workspaces
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => navigate(`/workspaces/${plan?.workspace?._id || plan?.workspace}`)}
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Workspace
        </Button>

        <PlanHeader 
          plan={plan} 
          onEditPlan={openPlanModal}
          onAddSection={() => openSectionModal()}
          onDownload={handleDownload}
          onShareTemplate={handleShareTemplate}
          onCopyTemplate={handleCopyTemplate}
          onSmartEdit={() => setSmartEditorOpen(true)}
          onUpdateStatus={handleUpdateStatus}
          showStats={showStats}
          onToggleStats={() => {
            const next = !showStats
            setShowStats(next)
            localStorage.setItem("planner_show_plan_stats", String(next))
          }}
          onCreateNewPlan={openCreatePlanModal}
        />

        {/* Progress Card - Hidden by default, togglable */}
        {showStats && (
          <Card className="mt-4 lg:mt-6 border-border shadow-xs animate-in fade-in duration-200">
            <CardContent className="p-3.5 sm:p-5 lg:p-6">
              {/* Progress Bar & Percentage */}
              <div className="mb-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs sm:text-sm font-semibold text-muted-foreground">Overall Progress</span>
                  <span className="text-sm sm:text-base font-bold text-foreground">{stats.progress}%</span>
                </div>
                <Progress value={stats.progress} className="h-2 sm:h-2.5" />
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 pt-2.5 border-t border-border">
                <div className="rounded-lg bg-accent/40 p-2 sm:p-3 text-center">
                  <p className="text-base sm:text-xl font-bold text-foreground leading-tight">{stats.totalItems}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Total Items</p>
                </div>
                <div className="rounded-lg bg-accent/40 p-2 sm:p-3 text-center">
                  <p className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-tight">{stats.completedItems}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Completed</p>
                </div>
                <div className="rounded-lg bg-accent/40 p-2 sm:p-3 text-center">
                  <p className="text-base sm:text-xl font-bold text-foreground leading-tight">{formatDuration(stats.totalDuration)}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Total Time</p>
                </div>
                <div className="rounded-lg bg-accent/40 p-2 sm:p-3 text-center">
                  <p className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-tight">{formatDuration(stats.completedDuration)}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Completed Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sections and Items */}
      <PlanSections
        planId={planId}
        sections={sections}
        items={items}
        collapsedSections={collapsedSections}
        onToggleSection={toggleSection}
        onAddSection={() => openSectionModal()}
        onEditSection={(sec) => openSectionModal(sec)}
        onDeleteSection={handleDeleteSection}
        onAddItem={(item, secId) => openItemModal(item, secId)}
        onQuickAdd={handleQuickAddItem}
        onToggleItem={handleToggleItemStatus}
        onEditItem={(item) => openItemModal(item)}
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

      {/* Plan Modal - Edit Plan */}
      <Modal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title="Edit Plan Details"
      >
        <form onSubmit={handlePlanSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground/80 mb-2">
              Plan Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              placeholder="e.g. Backend Architecture, React Mastery"
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
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              placeholder="Brief overview or goals for this roadmap..."
              rows={2}
              className="w-full rounded-lg border border-input bg-card p-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground/80 mb-2">Color Accent</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={planForm.color}
                onChange={(e) => setPlanForm({ ...planForm, color: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded-lg border border-input bg-background"
              />
              <span className="text-xs text-muted-foreground font-mono">{planForm.color}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setPlanModalOpen(false)} className="px-3.5">
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={planSubmitting} className="px-4 shadow-xs">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Share Clean Template Modal */}
      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Share Clean Template"
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4">
            <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Pristine Template Guarantee
            </h4>
            <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed">
              When you share this plan as a template, all completion checkboxes, time tracking logs, and personal assignee states are completely reset. Whoever imports this template gets a brand-new uncompleted roadmap ready to start from scratch.
            </p>
          </div>

          {templateData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{templateData.sections?.length || 0} Sections • {templateData.items?.length || 0} Tasks (all reset to uncompleted)</span>
                <span className="font-medium text-foreground">{templateData.name}</span>
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  value={JSON.stringify(templateData, null, 2)}
                  className="h-44 w-full rounded-md border border-input bg-muted/40 p-3 font-mono text-xs leading-tight text-foreground focus:outline-none resize-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  Download Template JSON
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(templateData, null, 2))
                      toast.success("Template JSON copied!")
                    }}
                    className="gap-1.5"
                  >
                    <Copy className="h-4 w-4" />
                    Copy JSON
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShareModalOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Create New Plan Modal */}
      <Modal isOpen={createPlanModalOpen} onClose={() => setCreatePlanModalOpen(false)} title="Create New Plan">
        <form onSubmit={handleCreateNewPlan} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground/80 mb-2">Plan Type</label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(PLAN_TYPE_LABELS).map(([type, config]) => {
                const Icon = PLAN_TYPE_ICONS[type]
                const isSelected = newPlanForm.type === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewPlanForm({ ...newPlanForm, type, color: config.color })}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all text-center cursor-pointer",
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-2xs ring-1 ring-emerald-500 font-semibold"
                        : "border-border hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" style={{ color: config.color }} />
                    <span className="text-[11px] leading-tight truncate w-full">{config.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground/80 mb-2">
              Plan Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={newPlanForm.name}
              onChange={(e) => setNewPlanForm({ ...newPlanForm, name: e.target.value })}
              placeholder="e.g. Backend Architecture, React Mastery"
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
              value={newPlanForm.description}
              onChange={(e) => setNewPlanForm({ ...newPlanForm, description: e.target.value })}
              placeholder="Brief overview or goals for this roadmap..."
              rows={2}
              className="w-full rounded-lg border border-input bg-card p-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground/80 mb-2">Color Accent</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newPlanForm.color}
                onChange={(e) => setNewPlanForm({ ...newPlanForm, color: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded-lg border border-input bg-background"
              />
              <span className="text-xs text-muted-foreground font-mono">{newPlanForm.color}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreatePlanModalOpen(false)} className="px-3.5">
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={createPlanSubmitting} className="px-4 shadow-xs">
              Create Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default PlanPage