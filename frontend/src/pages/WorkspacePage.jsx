import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { workspaceAPI, planAPI } from "../api/index.js"
import { useToast } from "../context/ToastContext.jsx"
import { useConfirm } from "../context/ConfirmContext.jsx"
import { Plus, ArrowLeft, Folder, BookOpen, Calendar, Sun, Layers, MoreVertical, Pencil, Trash2, Archive, Bookmark, RotateCcw, Share2, FileUp, Copy } from "lucide-react"
import Button from "../components/ui/Button.jsx"
import Input from "../components/ui/Input.jsx"
import { Card, CardContent } from "../components/ui/Card.jsx"
import Badge from "../components/ui/Badge.jsx"
import Progress from "../components/ui/Progress.jsx"
import Modal from "../components/ui/Modal.jsx"
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx"
import { Dropdown, DropdownItem, DropdownSeparator } from "../components/ui/Dropdown.jsx"
import { PLAN_TYPES, PLAN_TYPE_LABELS } from "../utils/constants.js"
import { formatDuration, generateColor } from "../utils/helpers.js"

const PLAN_TYPE_ICONS = {
  project: Folder,
  study: BookOpen,
  event: Calendar,
  daily: Sun,
  free: Layers,
}

function WorkspacePage() {
  const { workspaceId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const confirm = useConfirm()
  const [workspace, setWorkspace] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importJSONText, setImportJSONText] = useState("")
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState("active") // "active" | "stashed" | "archived" | "all"
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: PLAN_TYPES.PROJECT,
    color: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const handleImportTemplate = async (e) => {
    e.preventDefault()
    if (!importJSONText.trim()) {
      toast.error("Please paste template JSON")
      return
    }

    try {
      setImportSubmitting(true)
      let parsed = JSON.parse(importJSONText.trim())
      // Support both raw template object and API wrapper format
      if (parsed.data) parsed = parsed.data

      const { data } = await planAPI.cloneFromTemplate({
        workspaceId,
        templateData: parsed,
      })

      const newPlan = data.data || data
      setPlans((prev) => [newPlan, ...prev])
      setImportModalOpen(false)
      setImportJSONText("")
      toast.success("Fresh template imported as new plan!")
      navigate(`/plans/${newPlan._id}`)
    } catch (err) {
      toast.error(err.message || "Invalid template JSON")
    } finally {
      setImportSubmitting(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [workspaceId])

  const fetchData = async () => {
    try {
      const [workspaceRes, plansRes] = await Promise.all([
        workspaceAPI.getOne(workspaceId),
        planAPI.getAll({ workspace: workspaceId }),
      ])
      setWorkspace(workspaceRes.data)
      setPlans(plansRes.data || [])
    } catch (error) {
      toast.error("Failed to load workspace")
      navigate("/workspaces")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePlanStatus = async (planId, newStatus) => {
    try {
      await planAPI.update(planId, { status: newStatus })
      setPlans((prev) =>
        prev.map((p) => (p._id === planId ? { ...p, status: newStatus } : p))
      )
      toast.success(`Plan marked as ${newStatus}`)
    } catch (error) {
      toast.error(error.message || "Failed to update status")
    }
  }

  const handleCreatePlan = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data } = await planAPI.create({
        ...formData,
        workspace: workspaceId,
      })
      setPlans((prev) => [data, ...prev])
      setModalOpen(false)
      toast.success("Plan created")
      navigate(`/plans/${data._id}`)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePlan = async (plan) => {
    const confirmed = await confirm({
      title: "Delete Plan",
      message: `Are you sure you want to delete "${plan.name}" and all its tasks? This action cannot be undone.`,
      confirmText: "Delete Plan",
      variant: "destructive",
      icon: "trash",
    })

    if (!confirmed) return

    try {
      await planAPI.delete(plan._id)
      setPlans((prev) => prev.filter((p) => p._id !== plan._id))
      toast.success("Plan deleted")
    } catch (error) {
      toast.error(error.message)
    }
  }

  const openCreateModal = () => {
    setFormData({
      name: "",
      description: "",
      type: PLAN_TYPES.PROJECT,
      color: generateColor(),
    })
    setModalOpen(true)
  }

  const filteredPlans = plans.filter((plan) => {
    const currentStatus = plan.status || "active"
    if (statusFilter === "all") return true
    return currentStatus === statusFilter
  })

  const countByStatus = {
    active: plans.filter((p) => (p.status || "active") === "active").length,
    stashed: plans.filter((p) => p.status === "stashed").length,
    archived: plans.filter((p) => p.status === "archived").length,
    all: plans.length,
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-3 text-xs text-muted-foreground hover:text-foreground" onClick={() => navigate("/workspaces")}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Workspaces
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl shadow-xs"
              style={{ backgroundColor: workspace?.color || "#10B981" }}
            >
              <Folder className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">{workspace?.name}</h1>
              {workspace?.description && (
                <p className="mt-0.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{workspace.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportModalOpen(true)}
              className="px-2.5 sm:px-3 text-xs sm:text-sm"
              title="Import Template"
            >
              <FileUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400 sm:mr-1.5" />
              <span className="hidden sm:inline">Import Template</span>
            </Button>
            <Button
              size="sm"
              onClick={openCreateModal}
              className="px-2.5 sm:px-3 text-xs sm:text-sm"
              title="New Plan"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">New Plan</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs (Active, Stashed, Archived, All) */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-gray-800 pb-2 mb-6">
        {[
          { key: "active", label: "Active", count: countByStatus.active },
          { key: "stashed", label: "Stashed", count: countByStatus.stashed, icon: Bookmark },
          { key: "archived", label: "Archived", count: countByStatus.archived, icon: Archive },
          { key: "all", label: "All Plans", shortLabel: "All", count: countByStatus.all },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = statusFilter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {Icon && <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
              <span>{tab.shortLabel ? <><span className="hidden sm:inline">{tab.label}</span><span className="sm:hidden">{tab.shortLabel}</span></> : tab.label}</span>
              <span className={`text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full font-medium ${
                isActive 
                  ? "bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200" 
                  : "bg-gray-200/60 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Layers className="h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
              {statusFilter === "stashed" 
                ? "No stashed plans" 
                : statusFilter === "archived" 
                ? "No archived plans" 
                : "No plans yet"}
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {statusFilter === "stashed"
                ? "Plans you stash for future reference or pause will appear here"
                : statusFilter === "archived"
                ? "Completed or closed plans you archive will appear here"
                : "Create your first plan to start organizing your work"}
            </p>
            {statusFilter === "active" && (
              <Button className="mt-6" onClick={openCreateModal}>
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan) => {
            const Icon = PLAN_TYPE_ICONS[plan.type] || Layers
            const typeConfig = PLAN_TYPE_LABELS[plan.type] || {}
            const currentStatus = plan.status || "active"

            return (
              <Card 
                key={plan._id} 
                onClick={() => navigate(`/plans/${plan._id}`)}
                className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-emerald-500/30 active:scale-[0.99]"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg shadow-xs"
                      style={{ backgroundColor: plan.color || typeConfig.color }}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Dropdown
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        }
                        align="right"
                      >
                        <DropdownItem onClick={() => navigate(`/plans/${plan._id}`)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownItem>
                        <DropdownItem onClick={async () => {
                          try {
                            const res = await planAPI.getTemplate(plan._id)
                            const cleanTemplate = res.data?.data || res.data
                            await navigator.clipboard.writeText(JSON.stringify(cleanTemplate, null, 2))
                            toast.success("Fresh template JSON copied to clipboard!")
                          } catch {
                            toast.error("Failed to copy template JSON")
                          }
                        }}>
                          <Share2 className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          Share Template
                        </DropdownItem>
                        
                        <DropdownSeparator />
                        {currentStatus === "active" ? (
                          <>
                            <DropdownItem onClick={() => handleUpdatePlanStatus(plan._id, "stashed")}>
                              <Bookmark className="mr-2 h-4 w-4 text-purple-500" />
                              Stash for later
                            </DropdownItem>
                            <DropdownItem onClick={() => handleUpdatePlanStatus(plan._id, "archived")}>
                              <Archive className="mr-2 h-4 w-4 text-amber-500" />
                              Archive plan
                            </DropdownItem>
                          </>
                        ) : (
                          <DropdownItem onClick={() => handleUpdatePlanStatus(plan._id, "active")}>
                            <RotateCcw className="mr-2 h-4 w-4 text-emerald-600" />
                            Restore to Active
                          </DropdownItem>
                        )}

                        <DropdownSeparator />
                        <DropdownItem onClick={() => handleDeletePlan(plan)} destructive>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownItem>
                      </Dropdown>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex-1 truncate">{plan.name}</h3>
                      {currentStatus === "stashed" && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                          Stashed
                        </Badge>
                      )}
                      {currentStatus === "archived" && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
                          Archived
                        </Badge>
                      )}
                    </div>
                    <Badge variant="secondary" className="mt-1.5 text-xs">
                      {typeConfig.label || plan.type}
                    </Badge>
                  </div>

                  <div className="mt-3.5">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Progress</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{plan.progress || 0}%</span>
                    </div>
                    <Progress value={plan.progress || 0} className="h-1.5" />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span>{formatDuration(plan.totalDuration)}</span>
                    <span>{formatDuration(plan.completedDuration)} completed</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Plan Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Plan">
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Plan Type</label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(PLAN_TYPE_LABELS).map(([type, config]) => {
                const Icon = PLAN_TYPE_ICONS[type]
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type, color: config.color })}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
                      formData.type === type
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="h-5 w-5" style={{ color: config.color }} />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{config.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Plan"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Description</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Plan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Import Clean Template Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => {
          setImportModalOpen(false)
          setImportJSONText("")
        }}
        title="Import Plan From Clean Template"
        size="lg"
      >
        <form onSubmit={handleImportTemplate} className="space-y-4">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4">
            <p className="text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed">
              Paste a shared template JSON below to import it into <strong>{workspace?.name}</strong>. It will be created with all tasks in pristine, uncompleted state ready for you to track.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Template JSON *</label>
            <textarea
              value={importJSONText}
              onChange={(e) => setImportJSONText(e.target.value)}
              placeholder="Paste template JSON here..."
              rows={8}
              required
              className="w-full rounded-md border border-input bg-muted/40 p-3 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setImportModalOpen(false)
                setImportJSONText("")
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={importSubmitting} className="gap-1.5">
              <FileUp className="h-4 w-4" />
              Import Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default WorkspacePage
