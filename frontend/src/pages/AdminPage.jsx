import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext.jsx"
import { useToast } from "../context/ToastContext.jsx"
import { adminAPI } from "../api/index.js"
import {
  Users,
  Shield,
  Key,
  Trash2,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  Folder,
  Layers,
  ArrowLeft,
  RefreshCw,
  Edit2,
  Clock,
  AlertTriangle,
  Zap,
} from "lucide-react"

import Button from "../components/ui/Button.jsx"
import Input from "../components/ui/Input.jsx"
import Modal from "../components/ui/Modal.jsx"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card.jsx"
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx"
import { formatDate } from "../utils/helpers.js"

function AdminPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [editForm, setEditForm] = useState({ name: "", role: "user", dailyCapacity: 480 })
  const [submittingEdit, setSubmittingEdit] = useState(false)

  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [submittingPassword, setSubmittingPassword] = useState(false)

  const [confirmWipeModalOpen, setConfirmWipeModalOpen] = useState(false)
  const [submittingWipe, setSubmittingWipe] = useState(false)

  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers({ search, role: roleFilter }),
      ])
      setStats(statsRes.data?.data || statsRes.data)
      setUsers(usersRes.data?.data || usersRes.data || [])
    } catch (err) {
      toast.error(err.message || "Failed to load admin panel data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [roleFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchData()
  }

  // Open Edit User
  const handleOpenEdit = (targetUser) => {
    setSelectedUser(targetUser)
    setEditForm({
      name: targetUser.name,
      role: targetUser.role || "user",
      dailyCapacity: targetUser.dailyCapacity || 480,
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!selectedUser) return
    try {
      setSubmittingEdit(true)
      await adminAPI.updateUser(selectedUser._id, editForm)
      toast.success(`User ${editForm.name} updated successfully`)
      setEditModalOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.message || "Failed to update user")
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Reset Password
  const handleOpenPassword = (targetUser) => {
    setSelectedUser(targetUser)
    setNewPassword("")
    setPasswordModalOpen(true)
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    if (!selectedUser) return
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    try {
      setSubmittingPassword(true)
      await adminAPI.resetPassword(selectedUser._id, newPassword)
      toast.success(`Password for ${selectedUser.email} reset successfully`)
      setPasswordModalOpen(false)
    } catch (err) {
      toast.error(err.message || "Failed to reset password")
    } finally {
      setSubmittingPassword(false)
    }
  }

  // Wipe User Data
  const handleOpenWipe = (targetUser) => {
    setSelectedUser(targetUser)
    setConfirmWipeModalOpen(true)
  }

  const handleConfirmWipe = async () => {
    if (!selectedUser) return
    try {
      setSubmittingWipe(true)
      await adminAPI.wipeUserData(selectedUser._id)
      toast.success(`Experimental data for ${selectedUser.name} wiped cleanly`)
      setConfirmWipeModalOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.message || "Failed to wipe user data")
    } finally {
      setSubmittingWipe(false)
    }
  }

  // Delete / Deactivate User
  const handleOpenDelete = (targetUser) => {
    setSelectedUser(targetUser)
    setConfirmDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedUser) return
    try {
      setSubmittingDelete(true)
      await adminAPI.deleteUser(selectedUser._id)
      toast.success(`User ${selectedUser.email} deactivated successfully`)
      setConfirmDeleteModalOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.message || "Failed to deactivate user")
    } finally {
      setSubmittingDelete(false)
    }
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingSpinner size="lg" message="Loading Admin Workspace..." />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Bar with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 text-xs text-muted-foreground hover:text-foreground -ml-2"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shadow-xs">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Administration Portal
              </h1>
              <p className="text-xs text-muted-foreground">
                Manage system users, credentials, roles, and resource allocations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="gap-2 text-xs"
            title="Refresh admin data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* SYSTEM OVERVIEW METRICS */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-border shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Users</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                    {stats.users?.total || 0}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>{stats.users?.admins || 0} Administrators</span>
                <span>{stats.users?.standard || 0} Standard</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Workspaces</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                    {stats.workspaces || 0}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Folder className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Active Workspaces</span>
                <span>All Users</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Plans Created</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                    {stats.plans?.total || 0}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Layers className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>{stats.plans?.active || 0} Active</span>
                <span>{stats.plans?.stashed || 0} Stashed</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Tasks</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                    {stats.items?.total || 0}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>{stats.items?.completed || 0} Completed</span>
                <span>{stats.sessions || 0} Focus Sessions</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* USER MANAGEMENT TABLE */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                User Accounts ({users.length})
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                View, configure roles, reset passwords, or clear test data
              </p>
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search user name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-accent/40"
                />
              </form>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="user">Standard Users</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border/80 bg-accent/30 text-muted-foreground font-medium uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Workspaces</th>
                  <th className="py-2.5 px-3">Plans</th>
                  <th className="py-2.5 px-3">Joined</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No users found matching your search criteria
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = String(u._id) === String(user?._id)
                    const isDemo = u.email === "demo@planner.com"

                    return (
                      <tr key={u._id} className="hover:bg-accent/30 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-center shrink-0 uppercase text-xs">
                              {u.name?.charAt(0) || "U"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-normal">
                                    You
                                  </span>
                                )}
                                {isDemo && (
                                  <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                                    <Zap className="h-2.5 w-2.5" /> Demo Account
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {u.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300">
                              <Shield className="h-3 w-3" /> Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground">
                              User
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-muted-foreground font-medium">
                          {u.workspacesCount || 0}
                        </td>

                        <td className="py-3 px-3 text-muted-foreground font-medium">
                          {u.plansCount || 0}
                        </td>

                        <td className="py-3 px-3 text-muted-foreground">
                          {formatDate(u.createdAt)}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Edit user details and role"
                              onClick={() => handleOpenEdit(u)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Reset user password"
                              onClick={() => handleOpenPassword(u)}
                            >
                              <Key className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                              title="Wipe experimental data (Clean Slate)"
                              onClick={() => handleOpenWipe(u)}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>

                            {!isSelf && !isDemo && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                title="Deactivate user"
                                onClick={() => handleOpenDelete(u)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* EDIT USER MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit User Account"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground/80 mb-2">
              Full Name
            </label>
            <Input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
              className="h-9 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground/80 mb-2">
              Email Address
            </label>
            <Input
              value={selectedUser?.email || ""}
              disabled
              className="h-9 text-sm opacity-60 bg-muted/40 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground/80 mb-2">
              System Role
            </label>
            <select
              value={editForm.role}
              disabled={String(selectedUser?._id) === String(user?._id)}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              className="w-full h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            >
              <option value="user">Standard User</option>
              <option value="admin">System Administrator</option>
            </select>
            {String(selectedUser?._id) === String(user?._id) && (
              <p className="text-[11px] text-muted-foreground mt-1">
                You cannot modify your own administrator role.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground/80 mb-2">
              Daily Capacity (Minutes)
            </label>
            <Input
              type="number"
              value={editForm.dailyCapacity}
              onChange={(e) => setEditForm({ ...editForm, dailyCapacity: e.target.value })}
              min={0}
              max={1440}
              className="h-9 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submittingEdit}>
              Save User
            </Button>
          </div>
        </form>
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Reset User Password"
      >
        <form onSubmit={handleSavePassword} className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Set a new temporary password for{" "}
            <span className="font-semibold text-foreground">{selectedUser?.email}</span>.
          </p>
          <div>
            <label className="block text-xs font-medium text-foreground/80 mb-2">
              New Password <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoFocus
              className="h-9 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={submittingPassword}>
              Reset Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM WIPE DATA MODAL */}
      <Modal
        isOpen={confirmWipeModalOpen}
        onClose={() => setConfirmWipeModalOpen(false)}
        title="Wipe User Experimental Data"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Reset to Clean Slate</p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                This will delete all workspaces, plans, sections, and tasks created by{" "}
                <strong className="underline">{selectedUser?.name}</strong>. Their login credentials
                and account profile will remain untouched.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmWipeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              loading={submittingWipe}
              onClick={handleConfirmWipe}
            >
              Wipe Experimental Data
            </Button>
          </div>
        </div>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal
        isOpen={confirmDeleteModalOpen}
        onClose={() => setConfirmDeleteModalOpen(false)}
        title="Deactivate User Account"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Are you sure you want to deactivate{" "}
            <span className="font-semibold text-foreground">{selectedUser?.email}</span>? The user
            will no longer be able to log in to Planner.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              loading={submittingDelete}
              onClick={handleConfirmDelete}
            >
              Deactivate User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminPage
