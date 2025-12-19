import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { workspaceAPI, planAPI } from "../api/index.js"
import { useToast } from "../context/ToastContext.jsx"
import { Plus, ArrowLeft, Folder, BookOpen, Calendar, Sun, Layers, MoreVertical, Pencil, Trash2 } from "lucide-react"
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
  const [workspace, setWorkspace] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: PLAN_TYPES.PROJECT,
    color: "",
  })
  const [submitting, setSubmitting] = useState(false)

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
    if (!confirm(`Delete "${plan.name}"? This action cannot be undone.`)) return

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
        <Button variant="ghost" className="mb-4" onClick={() => navigate("/workspaces")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workspaces
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-lg"
              style={{ backgroundColor: workspace?.color || "#10B981" }}
            >
              <Folder className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{workspace?.name}</h1>
              {workspace?.description && (
                <p className="mt-1 text-gray-500 dark:text-gray-400">{workspace.description}</p>
              )}
            </div>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Layers className="h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">No plans yet</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Create your first plan to start organizing your work
            </p>
            <Button className="mt-6" onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = PLAN_TYPE_ICONS[plan.type] || Layers
            const typeConfig = PLAN_TYPE_LABELS[plan.type] || {}

            return (
              <Card key={plan._id} className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: plan.color || typeConfig.color }}
                      onClick={() => navigate(`/plans/${plan._id}`)}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      }
                      align="right"
                    >
                      <DropdownItem onClick={() => navigate(`/plans/${plan._id}`)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem onClick={() => handleDeletePlan(plan)} destructive>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownItem>
                    </Dropdown>
                  </div>

                  <div className="mt-4" onClick={() => navigate(`/plans/${plan._id}`)}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{plan.name}</h3>
                    <Badge variant="secondary" className="mt-2">
                      {typeConfig.label || plan.type}
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Progress</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{plan.progress || 0}%</span>
                    </div>
                    <Progress value={plan.progress || 0} className="mt-2" />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
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
    </div>
  )
}

export default WorkspacePage
