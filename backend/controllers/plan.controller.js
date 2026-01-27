import asyncHandler from "express-async-handler"
import Plan from "../models/plan.model.js"
import Section from "../models/section.model.js"
import Item from "../models/item.model.js"
import Session from "../models/session.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
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

// @desc    Import plan structure (Smart Editor - Sync Mode)
// @route   POST /api/plans/:id/import
// @access  Private
export const importPlanStructure = asyncHandler(async (req, res) => {
  await connectDB();
  const { sections } = req.body // Expecting array of { name, items: [{ title, priority, plannedDuration }] }
  const planId = req.params.id

  const plan = await Plan.findById(planId)

  if (!plan || plan.isDeleted) {
    res.status(404)
    throw new Error("Plan not found")
  }

  // Check permissions
  if (plan.createdBy.toString() !== req.user._id.toString()) {
    const isCollaborator = plan.collaborators.some(c => c.toString() === req.user._id.toString())
    if (!isCollaborator) {
      res.status(403)
      throw new Error("Not authorized to update this plan")
    }
  }

  // 1. Fetch all existing active sections and items
  const existingSections = await Section.find({ plan: planId, isDeleted: false })
  const existingItems = await Item.find({ plan: planId, isDeleted: false })

  const processedSectionIds = new Set()
  const processedItemIds = new Set()

  const finalSections = []

  // 2. Process Input Structure
  let sectionOrder = 0
  
  for (const sectionData of sections) {
    let section = existingSections.find(
      (s) => s.name.toLowerCase() === sectionData.name.toLowerCase()
    )

    if (section) {
      // Update existing section
      section.order = sectionOrder++
      section.isDeleted = false // Ensure it's active
      await section.save()
    } else {
      // Create new section
      section = await Section.create({
        name: sectionData.name,
        plan: planId,
        order: sectionOrder++,
      })
    }
    
    processedSectionIds.add(section._id.toString())
    finalSections.push(section)

    // Process Items for this Section
    if (sectionData.items && sectionData.items.length > 0) {
      let itemOrder = 0
      
      for (const itemData of sectionData.items) {
        // Try to find existing item in this section with same title
        let item = existingItems.find(
          (i) => 
            i.section.toString() === section._id.toString() && 
            i.title.toLowerCase() === itemData.title.toLowerCase()
        )

        if (item) {
          // Update existing item (preserve status, but update meta)
          item.order = itemOrder++
          item.priority = itemData.priority || item.priority
          item.plannedDuration = itemData.plannedDuration || item.plannedDuration
          item.description = itemData.description || item.description || ""
          
          // Explicitly update status if provided (allows [x] syntax to mark done)
          if (itemData.status) {
            item.status = itemData.status
          }
          
          item.isDeleted = false
          await item.save()
        } else {
          // Create new item
          item = await Item.create({
            title: itemData.title,
            description: itemData.description || "",
            plan: planId,
            section: section._id,
            order: itemOrder++,
            status: itemData.status || "todo",
            priority: itemData.priority || "medium",
            plannedDuration: itemData.plannedDuration || 60
          })
        }
        processedItemIds.add(item._id.toString())
      }
    }
  }

  // 3. Soft Delete Orphans (items/sections no longer in the text)
  
  // Delete orphaned items
  const itemsToDelete = existingItems.filter(i => !processedItemIds.has(i._id.toString()))
  if (itemsToDelete.length > 0) {
    await Item.updateMany(
      { _id: { $in: itemsToDelete.map(i => i._id) } },
      { isDeleted: true, deletedAt: new Date() }
    )
  }

  // Delete orphaned sections
  const sectionsToDelete = existingSections.filter(s => !processedSectionIds.has(s._id.toString()))
  if (sectionsToDelete.length > 0) {
    await Section.updateMany(
      { _id: { $in: sectionsToDelete.map(s => s._id) } },
      { isDeleted: true, deletedAt: new Date() }
    )
  }

  res.status(200).json(
    new ApiResponse(200, { sections: finalSections }, "Plan synced successfully")
  )
})
