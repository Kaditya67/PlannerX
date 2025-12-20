import asyncHandler from "express-async-handler"
import Plan from "../models/plan.model.js"
import Section from "../models/section.model.js"
import Item from "../models/item.model.js"
import Session from "../models/session.model.js"
import connectDB from "../config/db.js"

// @desc    Get all plans in workspace
// @route   GET /api/plans?workspace=:workspaceId
// @access  Private
export const getPlans = asyncHandler(async (req, res) => {
  await connectDB();
  const { workspace, type } = req.query

  const query = { isDeleted: false }
  if (workspace) query.workspace = workspace
  if (type) query.type = type

  const plans = await Plan.find(query)
    .populate("createdBy", "name email avatar")
    .populate("collaborators", "name email avatar")
    .sort({ updatedAt: -1 })

  res.status(200).json({ success: true, count: plans.length, data: plans })
})

// @desc    Get single plan with full tree
// @route   GET /api/plans/:id
// @access  Private
export const getPlan = asyncHandler(async (req, res) => {
  await connectDB();
  const plan = await Plan.findById(req.params.id)
    .populate("createdBy", "name email avatar")
    .populate("collaborators", "name email avatar")
    .populate("workspace", "name color")

  if (!plan || plan.isDeleted) {
    res.status(404)
    throw new Error("Plan not found")
  }

  // Get sections with items
  const sections = await Section.find({ plan: plan._id, isDeleted: false }).sort({ order: 1 })

  const items = await Item.find({ plan: plan._id, isDeleted: false })
    .populate("assignees", "name email avatar")
    .sort({ order: 1 })

  res.status(200).json({
    success: true,
    data: {
      ...plan.toObject(),
      sections,
      items,
    },
  })
})

// @desc    Create plan
// @route   POST /api/plans
// @access  Private
export const createPlan = asyncHandler(async (req, res) => {
  await connectDB();
  const {
    name,
    description,
    type,
    workspace,
    collaborationType,
    collaborators,
    startDate,
    endDate,
    deadline,
    color,
    icon,
    metadata,
    initialSections,
  } = req.body

  const plan = await Plan.create({
    name,
    description,
    type,
    workspace,
    createdBy: req.user._id,
    collaborationType,
    collaborators,
    startDate,
    endDate,
    deadline,
    color,
    icon,
    metadata,
  })

  // Create initial sections if provided
  if (initialSections?.length > 0) {
    const sectionsToCreate = initialSections.map((section, index) => ({
      name: section.name,
      description: section.description || "",
      plan: plan._id,
      order: index,
      color: section.color,
    }))

    await Section.insertMany(sectionsToCreate)
  }

  await plan.populate("createdBy", "name email avatar")
  await plan.populate("workspace", "name color")

  res.status(201).json({ success: true, data: plan })
})

// @desc    Update plan
// @route   PUT /api/plans/:id
// @access  Private
export const updatePlan = asyncHandler(async (req, res) => {
  await connectDB();
  const { name, description, collaborationType, collaborators, startDate, endDate, deadline, color, icon, metadata } =
    req.body

  let plan = await Plan.findById(req.params.id)

  if (!plan || plan.isDeleted) {
    res.status(404)
    throw new Error("Plan not found")
  }

  plan = await Plan.findByIdAndUpdate(
    req.params.id,
    {
      name,
      description,
      collaborationType,
      collaborators,
      startDate,
      endDate,
      deadline,
      color,
      icon,
      metadata: { ...plan.metadata, ...metadata },
    },
    { new: true, runValidators: true },
  )
    .populate("createdBy", "name email avatar")
    .populate("collaborators", "name email avatar")

  res.status(200).json({ success: true, data: plan })
})

// @desc    Delete plan
// @route   DELETE /api/plans/:id
// @access  Private
export const deletePlan = asyncHandler(async (req, res) => {
  await connectDB();
  const plan = await Plan.findById(req.params.id)

  if (!plan || plan.isDeleted) {
    res.status(404)
    throw new Error("Plan not found")
  }

  // Soft delete plan and related data
  await plan.softDelete()
  await Section.updateMany({ plan: plan._id }, { isDeleted: true, deletedAt: new Date() })
  await Item.updateMany({ plan: plan._id }, { isDeleted: true, deletedAt: new Date() })
  await Session.updateMany({ plan: plan._id }, { isDeleted: true, deletedAt: new Date() })

  res.status(200).json({ success: true, message: "Plan deleted" })
})

// @desc    Get plan statistics
// @route   GET /api/plans/:id/stats
// @access  Private
export const getPlanStats = asyncHandler(async (req, res) => {
  await connectDB();
  const plan = await Plan.findById(req.params.id)

  if (!plan || plan.isDeleted) {
    res.status(404)
    throw new Error("Plan not found")
  }

  const items = await Item.find({ plan: plan._id, isDeleted: false })

  const stats = {
    totalItems: items.length,
    completedItems: items.filter((i) => i.status === "completed").length,
    inProgressItems: items.filter((i) => i.status === "in_progress").length,
    todoItems: items.filter((i) => i.status === "todo").length,
    totalPlannedDuration: items.reduce((acc, i) => acc + (i.plannedDuration || 0), 0),
    totalActualDuration: items.reduce((acc, i) => acc + (i.actualDuration || 0), 0),
    progress: plan.progress,
    overdue: items.filter((i) => i.deadline && new Date(i.deadline) < new Date() && i.status !== "completed").length,
  }

  res.status(200).json({ success: true, data: stats })
})
