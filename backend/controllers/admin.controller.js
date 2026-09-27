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
    adminUsers,
    totalWorkspaces,
    totalPlans,
    totalItems,
    totalSessions,
  ] = await Promise.all([
    User.countDocuments({ isDeleted: false }),
    User.countDocuments({ role: "admin", isDeleted: false }),
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
        users: { total: totalUsers, admins: adminUsers, standard: totalUsers - adminUsers },
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

// @desc    Update user details / role / capacity
// @route   PATCH /api/admin/users/:userId
// @access  Private/Admin
export const updateUserByAdmin = asyncHandler(async (req, res) => {
  await connectDB()

  const { userId } = req.params
  const { name, role, dailyCapacity } = req.body

  const user = await User.findById(userId)
  if (!user || user.isDeleted) {
    res.status(404)
    throw new Error("User not found")
  }

  // Prevent admin from removing their own admin role
  if (String(user._id) === String(req.user._id) && role && role !== "admin") {
    res.status(400)
    throw new Error("Cannot remove your own admin privileges")
  }

  if (name) user.name = name
  if (role && ["user", "admin"].includes(role)) user.role = role
  if (dailyCapacity !== undefined) user.dailyCapacity = Number(dailyCapacity) || 480

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
