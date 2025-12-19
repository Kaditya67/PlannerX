import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { workspaceAPI } from "../api/index.js"
import { useToast } from "../context/ToastContext.jsx"
import { Plus, Folder, MoreVertical, Pencil, Trash2, Users } from "lucide-react"
import Button from "../components/ui/Button.jsx"
import Input from "../components/ui/Input.jsx"
import { Card, CardContent } from "../components/ui/Card.jsx"
import Badge from "../components/ui/Badge.jsx"
import Modal from "../components/ui/Modal.jsx"
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx"
import { Dropdown, DropdownItem, DropdownSeparator } from "../components/ui/Dropdown.jsx"
import { generateColor } from "../utils/helpers.js"

function WorkspacesPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState(null)
  const [formData, setFormData] = useState({ name: "", description: "", color: "" })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const fetchWorkspaces = async () => {
    try {
      const { data } = await workspaceAPI.getAll()
      setWorkspaces(data || [])
    } catch (error) {
      toast.error("Failed to load workspaces")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (workspace = null) => {
    if (workspace) {
      setEditingWorkspace(workspace)
      setFormData({
        name: workspace.name,
        description: workspace.description || "",
        color: workspace.color || generateColor(),
      })
    } else {
      setEditingWorkspace(null)
      setFormData({ name: "", description: "", color: generateColor() })
    }
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (editingWorkspace) {
        const { data } = await workspaceAPI.update(editingWorkspace._id, formData)
        setWorkspaces((prev) => prev.map((w) => (w._id === data._id ? data : w)))
        toast.success("Workspace updated")
      } else {
        const { data } = await workspaceAPI.create(formData)
        setWorkspaces((prev) => [data, ...prev])
        toast.success("Workspace created")
      }
      setModalOpen(false)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (workspace) => {
    if (!confirm(`Delete "${workspace.name}"? This action cannot be undone.`)) return

    try {
      await workspaceAPI.delete(workspace._id)
      setWorkspaces((prev) => prev.filter((w) => w._id !== workspace._id))
      toast.success("Workspace deleted")
    } catch (error) {
      toast.error(error.message)
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Workspaces</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Organize your plans into workspaces</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          New Workspace
        </Button>
      </div>

      {/* Workspaces Grid */}
      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Folder className="h-16 w-16 text-gray-300 dark:text-gray-600" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">No workspaces yet</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Create your first workspace to start organizing your plans
            </p>
            <Button className="mt-6" onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Card key={workspace._id} className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: workspace.color || "#10B981" }}
                    onClick={() => navigate(`/workspaces/${workspace._id}`)}
                  >
                    <Folder className="h-6 w-6 text-white" />
                  </div>
                  <Dropdown
                    trigger={
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    }
                    align="right"
                  >
                    <DropdownItem onClick={() => handleOpenModal(workspace)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem onClick={() => handleDelete(workspace)} destructive>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownItem>
                  </Dropdown>
                </div>

                <div className="mt-4" onClick={() => navigate(`/workspaces/${workspace._id}`)}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{workspace.name}</h3>
                  {workspace.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                      {workspace.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Badge variant="secondary">{workspace.plansCount || 0} plans</Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    {(workspace.members?.length || 0) + 1}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingWorkspace ? "Edit Workspace" : "Create Workspace"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Workspace"
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Color</label>
            <div className="flex gap-2">
              {["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    formData.color === color ? "scale-110 ring-2 ring-offset-2" : ""
                  }`}
                  style={{ backgroundColor: color, ringColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingWorkspace ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default WorkspacesPage
