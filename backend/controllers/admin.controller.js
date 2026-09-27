import asyncHandler from "express-async-handler"
import connectDB from "../config/db.js"
import User from "../models/user.model.js"
import Workspace from "../models/workspace.model.js"
import Plan from "../models/plan.model.js"
import Section from "../models/section.model.js"
import Item from "../models/item.model.js"
import Session from "../models/session.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"

// @desc    Get system overview statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getSystemStats = asyncHandler(async (req, res) => {
  await connectDB()

  const [
    totalUsers,
    devAdminUsers,
    adminUsers,
    managerUsers,
    totalWorkspaces,
    totalPlans,
    totalItems,
    totalSessions,
  ] = await Promise.all([
    User.countDocuments({ isDeleted: false }),
    User.countDocuments({ role: "devadmin", isDeleted: false }),
    User.countDocuments({ role: "admin", isDeleted: false }),
    User.countDocuments({ role: "manager", isDeleted: false }),
    Workspace.countDocuments({ isDeleted: false }),
    Plan.countDocuments({ isDeleted: false }),
    Item.countDocuments({ isDeleted: false }),
    Session.countDocuments({ isDeleted: false }),
  ])

  // Get active plans vs completed/archived
  const activePlans = await Plan.countDocuments({ status: "active", isDeleted: false })
  const stashedPlans = await Plan.countDocuments({ status: "stashed", isDeleted: false })
  const archivedPlans = await Plan.countDocuments({ status: "archived", isDeleted: false })

  // Completed items count
  const completedItems = await Item.countDocuments({ status: "completed", isDeleted: false })

  res.status(200).json(
    new ApiResponse(
      200,
      {
        users: {
          total: totalUsers,
          devAdmins: devAdminUsers,
          admins: adminUsers,
          managers: managerUsers,
          standard: totalUsers - (devAdminUsers + adminUsers + managerUsers),
        },
        workspaces: totalWorkspaces,
        plans: { total: totalPlans, active: activePlans, stashed: stashedPlans, archived: archivedPlans },
        items: { total: totalItems, completed: completedItems },
        sessions: totalSessions,
      },
      "System stats retrieved successfully"
    )
  )
})

// @desc    Get all users with workspace and plan counts
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(async (req, res) => {
  await connectDB()

  const { search, role } = req.query
  const query = { isDeleted: false }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ]
  }

  if (role && role !== "all") {
    query.role = role
  }

  const users = await User.find(query)
    .select("-password")
    .sort({ createdAt: -1 })
    .lean()

  // Augment users with their workspace and plan counts
  const userIds = users.map((u) => u._id)
  const [workspaces, plans] = await Promise.all([
    Workspace.aggregate([
      { $match: { owner: { $in: userIds }, isDeleted: false } },
      { $group: { _id: "$owner", count: { $sum: 1 } } },
    ]),
    Plan.aggregate([
      { $match: { createdBy: { $in: userIds }, isDeleted: false } },
      { $group: { _id: "$createdBy", count: { $sum: 1 } } },
    ]),
  ])

  const workspaceMap = Object.fromEntries(workspaces.map((w) => [String(w._id), w.count]))
  const planMap = Object.fromEntries(plans.map((p) => [String(p._id), p.count]))

  const enrichedUsers = users.map((u) => ({
    ...u,
    workspacesCount: workspaceMap[String(u._id)] || 0,
    plansCount: planMap[String(u._id)] || 0,
  }))

  res.status(200).json(
    new ApiResponse(200, enrichedUsers, "Users fetched successfully")
  )
})

// @desc    Update user details / role / capacity / status (activate/suspend)
// @route   PATCH /api/admin/users/:userId
// @access  Private/Admin
export const updateUserByAdmin = asyncHandler(async (req, res) => {
  await connectDB()

  const { userId } = req.params
  const { name, role, dailyCapacity, status, statusReason } = req.body

  const user = await User.findById(userId)
  if (!user || user.isDeleted) {
    res.status(404)
    throw new Error("User not found")
  }

  const isDevAdmin = req.user.role === "devadmin" || req.user.email === "ojhaaditya913@gmail.com"
  const isEditingSelf = String(user._id) === String(req.user._id)

  // Prevent non-devadmin from editing self role or suspending self
  if (isEditingSelf && !isDevAdmin) {
    if (role && role !== user.role) {
      res.status(400)
      throw new Error("Cannot change your own role unless you are DevAdmin")
    }
    if (status && status !== "active") {
      res.status(400)
      throw new Error("Cannot suspend your own account")
    }
  }

  // Prevent suspending the demo account
  if (user.email === "demo@planner.com" && status && status !== "active") {
    res.status(400)
    throw new Error("The system demo account cannot be suspended")
  }

  if (name) user.name = name
  if (role && ["user", "manager", "admin", "devadmin"].includes(role)) {
    // Only devadmin can assign the devadmin or admin role
    if ((role === "admin" || role === "devadmin") && !isDevAdmin) {
      res.status(403)
      throw new Error("Only the primary DevAdmin can grant administrator roles")
    }
    user.role = role
  }
  if (dailyCapacity !== undefined) user.dailyCapacity = Number(dailyCapacity) || 480
  if (status && ["active", "suspended", "deactivated"].includes(status)) {
    user.status = status
    user.statusReason = statusReason || ""
  }

  await user.save()

  res.status(200).json(
    new ApiResponse(200, user, "User updated successfully")
  )
})

// @desc    Reset a user's password (by admin)
// @route   POST /api/admin/users/:userId/reset-password
// @access  Private/Admin
export const resetUserPassword = asyncHandler(async (req, res) => {
  await connectDB()

  const { userId } = req.params
  const { newPassword } = req.body

  if (!newPassword || newPassword.length < 6) {
    res.status(400)
    throw new Error("New password must be at least 6 characters")
  }

  const user = await User.findById(userId)
  if (!user || user.isDeleted) {
    res.status(404)
    throw new Error("User not found")
  }

  user.password = newPassword
  await user.save()

  res.status(200).json(
    new ApiResponse(200, null, `Password for ${user.email} reset successfully`)
  )
})

// @desc    Reset / Wipe user workspace and plan data (Clean Slate)
// @route   POST /api/admin/users/:userId/wipe-data
// @access  Private/Admin
export const wipeUserData = asyncHandler(async (req, res) => {
  await connectDB()

  const { userId } = req.params

  const user = await User.findById(userId)
  if (!user || user.isDeleted) {
    res.status(404)
    throw new Error("User not found")
  }

  const userWorkspaces = await Workspace.find({ owner: user._id })
  const workspaceIds = userWorkspaces.map((w) => w._id)
  const userPlans = await Plan.find({ $or: [{ createdBy: user._id }, { workspace: { $in: workspaceIds } }] })
  const planIds = userPlans.map((p) => p._id)

  await Promise.all([
    Item.deleteMany({ plan: { $in: planIds } }),
    Section.deleteMany({ plan: { $in: planIds } }),
    Session.deleteMany({ user: user._id }),
    Plan.deleteMany({ _id: { $in: planIds } }),
    Workspace.deleteMany({ owner: user._id }),
  ])

  // Recreate default clean workspace
  await Workspace.create({
    name: "Personal",
    description: "Default personal workspace",
    color: "#10B981",
    icon: "folder",
    owner: user._id,
    members: [],
  })

  res.status(200).json(
    new ApiResponse(200, null, `All workspaces, plans, and items for ${user.name} have been cleared`)
  )
})

// @desc    Soft-delete user (or hard delete if specified)
// @route   DELETE /api/admin/users/:userId
// @access  Private/Admin
export const deleteUserByAdmin = asyncHandler(async (req, res) => {
  await connectDB()

  const { userId } = req.params

  if (String(userId) === String(req.user._id)) {
    res.status(400)
    throw new Error("Cannot delete your own account from admin panel")
  }

  const user = await User.findById(userId)
  if (!user) {
    res.status(404)
    throw new Error("User not found")
  }

  // Prevent deleting the system demo user directly
  if (user.email === "demo@planner.com") {
    res.status(400)
    throw new Error("System demo user cannot be deleted. You can wipe its data instead.")
  }

  // Soft delete user
  user.isDeleted = true
  user.deletedAt = new Date()
  await user.save()

  res.status(200).json(
    new ApiResponse(200, null, `User ${user.email} deactivated successfully`)
  )
})

// @desc    Get detailed overview of a single user (workspaces, plans, recent sessions)
// @route   GET /api/admin/users/:userId/details
// @access  Private/Admin
export const getUserDetails = asyncHandler(async (req, res) => {
  await connectDB()

  const { userId } = req.params

  const user = await User.findById(userId).select("-password").lean()
  if (!user || user.isDeleted) {
    res.status(404)
    throw new Error("User not found")
  }

  const [workspaces, plans, sessionsCount] = await Promise.all([
    Workspace.find({ owner: user._id, isDeleted: false }).lean(),
    Plan.find({ createdBy: user._id, isDeleted: false }).select("name type status progress totalDuration completedDuration createdAt").lean(),
    Session.countDocuments({ user: user._id, isDeleted: false }),
  ])

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user,
        workspaces,
        plans,
        sessionsCount,
      },
      "User details fetched successfully"
    )
  )
})
