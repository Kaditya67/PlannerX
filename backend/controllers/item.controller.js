import asyncHandler from "express-async-handler"
import Item from "../models/item.model.js"
import Section from "../models/section.model.js"
import Plan from "../models/plan.model.js"
import Workspace from "../models/workspace.model.js"
import connectDB from "../config/db.js"  

// @desc    Get items
// @route   GET /api/items?plan=:planId&section=:sectionId
// @access  Private
export const getItems = asyncHandler(async (req, res) => {
  await connectDB();
  const { plan, section, status, priority } = req.query

  const query = { isDeleted: false }

  if (plan) {
    query.plan = plan
  } else {
    // Find all workspaces accessible to this user
    const userWorkspaces = await Workspace.find({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
      isDeleted: false,
    }).select("_id")
    const workspaceIds = userWorkspaces.map((w) => w._id)

    if (workspaceIds.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] })
    }

    // Find all plans accessible to this user within their accessible workspaces
    const userPlans = await Plan.find({
      workspace: { $in: workspaceIds },
      isDeleted: false,
    }).select("_id")
    const planIds = userPlans.map((p) => p._id)

    if (planIds.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] })
    }

    query.plan = { $in: planIds }
  }

  if (section) query.section = section
  if (status) query.status = status
  if (priority) query.priority = priority

  const items = await Item.find(query).populate("assignees", "name email avatar").sort({ order: 1 })

  res.status(200).json({ success: true, count: items.length, data: items })
})

// @desc    Get single item
// @route   GET /api/items/:id
// @access  Private
export const getItem = asyncHandler(async (req, res) => {
  await connectDB();
  const item = await Item.findById(req.params.id)
    .populate("assignees", "name email avatar")
    .populate("dependencies")
    .populate("children")

  if (!item || item.isDeleted) {
    res.status(404)
    throw new Error("Item not found")
  }

  res.status(200).json({ success: true, data: item })
})

// @desc    Create item
// @route   POST /api/items
// @access  Private
export const createItem = asyncHandler(async (req, res) => {
  await connectDB();
  const {
    title,
    description,
    plan,
    section,
    parentItem,
    status,
    priority,
    assignees,
    plannedDuration,
    startDate,
    endDate,
    deadline,
    flexibility,
    dependencies,
    tags,
  } = req.body

  // Get max order
  const maxOrder = await Item.findOne({ plan, section: section || null, parentItem: parentItem || null })
    .sort({ order: -1 })
    .select("order")

  const item = await Item.create({
    title,
    description,
    plan,
    section,
    parentItem,
    status,
    priority,
    assignees,
    plannedDuration,
    startDate,
    endDate,
    deadline,
    flexibility,
    dependencies,
    tags,
    order: maxOrder ? maxOrder.order + 1 : 0,
  })

  // Update plan/section duration
  await recalculateDurations(plan, section)

  await item.populate("assignees", "name email avatar")

  res.status(201).json({ success: true, data: item })
})

// @desc    Update item
// @route   PUT /api/items/:id
// @access  Private
export const updateItem = asyncHandler(async (req, res) => {
  await connectDB();
  const {
    title,
    description,
    section,
    status,
    priority,
    assignees,
    plannedDuration,
    actualDuration,
    startDate,
    endDate,
    deadline,
    flexibility,
    dependencies,
    tags,
  } = req.body

  let item = await Item.findById(req.params.id)

  if (!item || item.isDeleted) {
    res.status(404)
    throw new Error("Item not found")
  }

  const oldSection = item.section

  item = await Item.findByIdAndUpdate(
    req.params.id,
    {
      title,
      description,
      section,
      status,
      priority,
      assignees,
      plannedDuration,
      actualDuration,
      startDate,
      endDate,
      deadline,
      flexibility,
      dependencies,
      tags,
    },
    { new: true, runValidators: true },
  ).populate("assignees", "name email avatar")

  // Recalculate durations
  await recalculateDurations(item.plan, section)
  if (oldSection && oldSection.toString() !== section?.toString()) {
    await recalculateDurations(item.plan, oldSection)
  }

  res.status(200).json({ success: true, data: item })
})

// @desc    Reorder items
// @route   PUT /api/items/reorder
// @access  Private
export const reorderItems = asyncHandler(async (req, res) => {
  await connectDB();
  const { items } = req.body // Array of { id, order, section, parentItem }

  const bulkOps = items.map(({ id, order, section, parentItem }) => ({
    updateOne: {
      filter: { _id: id },
      update: { order, section: section || null, parentItem: parentItem || null },
    },
  }))

  await Item.bulkWrite(bulkOps)

  res.status(200).json({ success: true, message: "Items reordered" })
})

// @desc    Delete item
// @route   DELETE /api/items/:id
// @access  Private
export const deleteItem = asyncHandler(async (req, res) => {
  await connectDB();
  const item = await Item.findById(req.params.id)

  if (!item || item.isDeleted) {
    res.status(404)
    throw new Error("Item not found")
  }

  // Soft delete item and children
  item.isDeleted = true
  item.deletedAt = new Date()
  await item.save()

  await Item.updateMany({ parentItem: item._id }, { isDeleted: true, deletedAt: new Date() })

  // Recalculate durations
  await recalculateDurations(item.plan, item.section)

  res.status(200).json({ success: true, message: "Item deleted" })
})

// Helper function
async function recalculateDurations(planId, sectionId) {
  const planItems = await Item.find({ plan: planId, isDeleted: false })
  const totalDuration = planItems.reduce((acc, item) => acc + (item.plannedDuration || 0), 0)
  const completedDuration = planItems
    .filter((i) => i.status === "completed")
    .reduce((acc, item) => acc + (item.actualDuration || item.plannedDuration || 0), 0)

  await Plan.findByIdAndUpdate(planId, { totalDuration, completedDuration })

  if (sectionId) {
    const sectionItems = await Item.find({ section: sectionId, isDeleted: false })
    const sectionTotal = sectionItems.reduce((acc, item) => acc + (item.plannedDuration || 0), 0)
    const sectionCompleted = sectionItems
      .filter((i) => i.status === "completed")
      .reduce((acc, item) => acc + (item.actualDuration || item.plannedDuration || 0), 0)

    await Section.findByIdAndUpdate(sectionId, {
      totalDuration: sectionTotal,
      completedDuration: sectionCompleted,
    })
  }
}
