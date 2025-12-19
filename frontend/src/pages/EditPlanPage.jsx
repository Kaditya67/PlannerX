import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useToast } from "../context/ToastContext.jsx"
import { planAPI } from "../api/index.js"
import { ArrowLeft, Save, Trash2, AlertCircle } from "lucide-react"
import Button from "../components/ui/Button.jsx"
import Input from "../components/ui/Input.jsx"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card.jsx"
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx"
import Modal from "../components/ui/Modal.jsx"

function EditPlanPage() {
  const { planId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [plan, setPlan] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    dueDate: "",
    priority: "medium",
    type: "personal"
  })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  useEffect(() => {
    fetchPlan()
  }, [planId])

  const fetchPlan = async () => {
    try {
      setLoading(true)
      const { data } = await planAPI.getOne(planId)
      setPlan(data)
      setFormData({
        name: data.name || "",
        description: data.description || "",
        color: data.color || "#3B82F6",
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : "",
        priority: data.priority || "medium",
        type: data.type || "personal"
      })
    } catch (error) {
      toast.error("Failed to load plan")
      navigate(`/plans/${planId}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const dataToSend = {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null
      }
      
      await planAPI.update(planId, dataToSend)
      toast.success("Plan updated successfully")
      navigate(`/plans/${planId}`)
    } catch (error) {
      toast.error(error.message || "Failed to update plan")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      setSubmitting(true)
      await planAPI.delete(planId)
      toast.success("Plan deleted successfully")
      navigate(`/workspaces/${plan?.workspace?._id || plan?.workspace}`)
    } catch (error) {
      toast.error(error.message || "Failed to delete plan")
      setSubmitting(false)
      setDeleteModalOpen(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(`/plans/${planId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plan
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Plan</h1>
            <p className="mt-2 text-muted-foreground">
              Make changes to your plan settings and details
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/plans/${planId}`)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={submitting}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Plan Name *
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter plan name"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your plan"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="h-10 w-10 cursor-pointer rounded border border-input bg-background"
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.color}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Due Date
                </label>
                <Input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Plan Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="team">Team</option>
                  <option value="project">Project</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone Card */}
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-foreground">Delete this plan</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Once deleted, this plan and all its sections and items cannot be recovered.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setDeleteModalOpen(true)}
                disabled={submitting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Plan"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">
                Are you absolutely sure?
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                This action cannot be undone. This will permanently delete the plan "
                <span className="font-semibold">{plan?.name}</span>" and all of its sections and items.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              loading={submitting}
            >
              Yes, Delete Plan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default EditPlanPage