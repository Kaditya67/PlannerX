import asyncHandler from "express-async-handler"
import Workspace from "../models/workspace.model.js"
import Plan from "../models/plan.model.js"
import { WORKSPACE_ROLES } from "../config/constants.js"
import connectDB from "../config/db.js"

// @desc    Get all workspaces for user
// @route   GET /api/workspaces
// @access  Private
export const getWorkspaces = asyncHandler(async (req, res) => {
  await connectDB();
  const workspaces = await Workspace.find({
    $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    isDeleted: false,
  })
    .populate("owner", "name email avatar")
    .populate("members.user", "name email avatar")
    .populate("plansCount")
    .sort({ updatedAt: -1 })

  res.status(200).json({ success: true, count: workspaces.length, data: workspaces })
})

// @desc    Get single workspace
// @route   GET /api/workspaces/:id
// @access  Private
export const getWorkspace = asyncHandler(async (req, res) => {
  await connectDB();
  const workspace = await Workspace.findById(req.params.id)
    .populate("owner", "name email avatar")
    .populate("members.user", "name email avatar")
    .populate("plansCount")

  if (!workspace || workspace.isDeleted) {
    res.status(404)
    throw new Error("Workspace not found")
  }

  // Check access
  const isOwner = workspace.owner._id.toString() === req.user._id.toString()
  const isMember = workspace.members.some((m) => m.user._id.toString() === req.user._id.toString())

  if (!isOwner && !isMember) {
    res.status(403)
    throw new Error("Not authorized to access this workspace")
  }

  res.status(200).json({ success: true, data: workspace })
})

// @desc    Create workspace
// @route   POST /api/workspaces
// @access  Private
export const createWorkspace = asyncHandler(async (req, res) => {
  await connectDB();
  const { name, description, color, icon } = req.body

  const workspace = await Workspace.create({
    name,
    description,
    color,
    icon,
    owner: req.user._id,
  })

  await workspace.populate("owner", "name email avatar")

  res.status(201).json({ success: true, data: workspace })
})

// @desc    Update workspace
// @route   PUT /api/workspaces/:id
// @access  Private (Owner/Admin)
export const updateWorkspace = asyncHandler(async (req, res) => {
  await connectDB();
  const { name, description, color, icon } = req.body

  let workspace = await Workspace.findById(req.params.id)

  if (!workspace || workspace.isDeleted) {
    res.status(404)
    throw new Error("Workspace not found")
  }

  // Check if owner or admin
  const isOwner = workspace.owner.toString() === req.user._id.toString()
  const member = workspace.members.find((m) => m.user.toString() === req.user._id.toString())
  const isAdmin = member?.role === WORKSPACE_ROLES.ADMIN

  if (!isOwner && !isAdmin) {
    res.status(403)
    throw new Error("Not authorized to update this workspace")
  }

  workspace = await Workspace.findByIdAndUpdate(
    req.params.id,
    { name, description, color, icon },
    { new: true, runValidators: true },
  )
    .populate("owner", "name email avatar")
    .populate("members.user", "name email avatar")

  res.status(200).json({ success: true, data: workspace })
})

// @desc    Delete workspace
// @route   DELETE /api/workspaces/:id
// @access  Private (Owner only)
export const deleteWorkspace = asyncHandler(async (req, res) => {
  await connectDB();
  const workspace = await Workspace.findById(req.params.id)

  if (!workspace || workspace.isDeleted) {
    res.status(404)
    throw new Error("Workspace not found")
  }

  if (workspace.owner.toString() !== req.user._id.toString()) {
    res.status(403)
    throw new Error("Only owner can delete workspace")
  }

  // Soft delete workspace and all plans
  await workspace.softDelete()
  await Plan.updateMany({ workspace: workspace._id }, { isDeleted: true, deletedAt: new Date() })

  res.status(200).json({ success: true, message: "Workspace deleted" })
})

// @desc    Add member to workspace
// @route   POST /api/workspaces/:id/members
// @access  Private (Owner/Admin)
export const addMember = asyncHandler(async (req, res) => {
  await connectDB();
  const { userId, role = WORKSPACE_ROLES.MEMBER } = req.body

  const workspace = await Workspace.findById(req.params.id)

  if (!workspace || workspace.isDeleted) {
    res.status(404)
    throw new Error("Workspace not found")
  }

  // Check permissions
  const isOwner = workspace.owner.toString() === req.user._id.toString()
  const member = workspace.members.find((m) => m.user.toString() === req.user._id.toString())

  if (!isOwner && member?.role !== WORKSPACE_ROLES.ADMIN) {
    res.status(403)
    throw new Error("Not authorized to add members")
  }

  // Check if already member
  if (workspace.members.some((m) => m.user.toString() === userId)) {
    res.status(400)
    throw new Error("User is already a member")
  }

  workspace.members.push({ user: userId, role })
  await workspace.save()

  await workspace.populate("members.user", "name email avatar")

  res.status(200).json({ success: true, data: workspace })
})

// @desc    Remove member from workspace
// @route   DELETE /api/workspaces/:id/members/:userId
// @access  Private (Owner/Admin)
export const removeMember = asyncHandler(async (req, res) => {
  await connectDB();
  const workspace = await Workspace.findById(req.params.id)

  if (!workspace || workspace.isDeleted) {
    res.status(404)
    throw new Error("Workspace not found")
  }

  const isOwner = workspace.owner.toString() === req.user._id.toString()
  const currentMember = workspace.members.find((m) => m.user.toString() === req.user._id.toString())

  if (!isOwner && currentMember?.role !== WORKSPACE_ROLES.ADMIN) {
    res.status(403)
    throw new Error("Not authorized to remove members")
  }

  workspace.members = workspace.members.filter((m) => m.user.toString() !== req.params.userId)
  await workspace.save()

  res.status(200).json({ success: true, data: workspace })
})
