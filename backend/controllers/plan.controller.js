import asyncHandler from "express-async-handler"
import Plan from "../models/plan.model.js"
import Section from "../models/section.model.js"
import Item from "../models/item.model.js"
import Session from "../models/session.model.js"
import Workspace from "../models/workspace.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import connectDB from "../config/db.js"

// @desc    Get all plans in workspace or user's accessible workspaces
// @route   GET /api/plans?workspace=:workspaceId
// @access  Private
export const getPlans = asyncHandler(async (req, res) => {
  await connectDB();
  const { workspace, type, status } = req.query

  const query = { isDeleted: false }

  if (workspace) {
    // Verify user has access to this workspace
    const ws = await Workspace.findOne({
      _id: workspace,
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
      isDeleted: false,
    })
    if (!ws) {
      return res.status(200).json({ success: true, count: 0, data: [] })
    }
    query.workspace = workspace
  } else {
    // Find all workspaces accessible to this user
    const userWorkspaces = await Workspace.find({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
      isDeleted: false,
    }).select("_id")
    const workspaceIds = userWorkspaces.map((w) => w._id)

    query.$or = [
      { workspace: { $in: workspaceIds } },
      { createdBy: req.user._id },
      { collaborators: req.user._id },
    ]
  }

  if (type) query.type = type
  if (status) query.status = status

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

  // Check access: must have access to workspace or be creator/collaborator
  const ws = await Workspace.findOne({
    _id: plan.workspace?._id || plan.workspace,
    $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    isDeleted: false,
  })

  const isCreator = plan.createdBy?._id?.toString() === req.user._id.toString() || plan.createdBy?.toString() === req.user._id.toString()
  const isCollaborator = plan.collaborators?.some(c => (c._id || c).toString() === req.user._id.toString())

  if (!ws && !isCreator && !isCollaborator) {
    res.status(403)
    throw new Error("Not authorized to access this plan")
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
  const { name, description, collaborationType, collaborators, startDate, endDate, deadline, color, icon, metadata, status, tags } =
    req.body

  let plan = await Plan.findById(req.params.id)

  if (!plan || plan.isDeleted) {
    res.status(404)
    throw new Error("Plan not found")
  }

  const updateFields = {}
  if (name !== undefined) updateFields.name = name
  if (description !== undefined) updateFields.description = description
  if (collaborationType !== undefined) updateFields.collaborationType = collaborationType
  if (collaborators !== undefined) updateFields.collaborators = collaborators
  if (startDate !== undefined) updateFields.startDate = startDate
  if (endDate !== undefined) updateFields.endDate = endDate
  if (deadline !== undefined) updateFields.deadline = deadline
  if (color !== undefined) updateFields.color = color
  if (icon !== undefined) updateFields.icon = icon
  if (metadata !== undefined) updateFields.metadata = { ...plan.metadata, ...metadata }
  if (status !== undefined) updateFields.status = status
  if (tags !== undefined) updateFields.tags = tags

  plan = await Plan.findByIdAndUpdate(
    req.params.id,
    updateFields,
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

// @desc    Export plan as clean template (all items reset to uncompleted / fresh state)
// @route   GET /api/plans/:id/template
// @access  Private
export const getPlanTemplate = asyncHandler(async (req, res) => {
  await connectDB();
  const plan = await Plan.findById(req.params.id)

  if (!plan || plan.isDeleted) {
    res.status(404)
    throw new Error("Plan not found")
  }

  // Fetch sections and items
  const sections = await Section.find({ plan: plan._id, isDeleted: false }).sort({ order: 1 })
  const items = await Item.find({ plan: plan._id, isDeleted: false }).sort({ order: 1 })

  // Clean template data: items have pending/todo status, 0 actual duration, no assignees
  const cleanSections = sections.map((s) => ({
    name: s.name,
    description: s.description || "",
    color: s.color,
    order: s.order,
    _tempId: s._id.toString(),
  }))

  const cleanItems = items.map((i) => ({
    title: i.title,
    description: i.description || "",
    sectionTempId: i.section ? i.section.toString() : null,
    priority: i.priority || "medium",
    plannedDuration: i.plannedDuration || 60,
    status: "todo",
    order: i.order,
  }))

  const templateData = {
    name: `${plan.name} (Template)`,
    description: plan.description || "",
    type: plan.type,
    color: plan.color,
    icon: plan.icon,
    metadata: plan.metadata,
    sections: cleanSections,
    items: cleanItems,
  }

  res.status(200).json(new ApiResponse(200, templateData, "Clean plan template generated"))
})

// @desc    Import/Clone a plan from clean template into a target workspace
// @route   POST /api/plans/clone-template
// @access  Private
export const clonePlanFromTemplate = asyncHandler(async (req, res) => {
  await connectDB();
  const { workspaceId, templateData, customName } = req.body

  if (!workspaceId || !templateData) {
    res.status(400)
    throw new Error("Workspace ID and template data are required")
  }

  // Verify access to destination workspace
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    isDeleted: false,
  })

  if (!workspace) {
    res.status(404)
    throw new Error("Target workspace not found or access denied")
  }

  const { name, description, type, color, icon, metadata, sections = [], items = [] } = templateData

  // 1. Create new fresh plan
  const newPlan = await Plan.create({
    name: customName || name || "Cloned Plan",
    description: description || "",
    type: type || "project",
    workspace: workspace._id,
    createdBy: req.user._id,
    color: color || "#10B981",
    icon: icon || "clipboard",
    metadata: metadata || {},
    status: "active",
    totalDuration: 0,
    completedDuration: 0,
  })

  // 2. Map old section temp IDs to newly created section ObjectIds
  const sectionIdMap = new Map()

  for (const s of sections) {
    const createdSection = await Section.create({
      name: s.name,
      description: s.description || "",
      plan: newPlan._id,
      color: s.color,
      order: s.order || 0,
    })
    if (s._tempId) {
      sectionIdMap.set(s._tempId, createdSection._id)
    }
  }

  // 3. Create items in fresh, uncompleted state
  let totalDuration = 0
  const itemsToCreate = []

  for (const item of items) {
    const plannedDur = item.plannedDuration || 60
    totalDuration += plannedDur

    const targetSectionId = item.sectionTempId ? sectionIdMap.get(item.sectionTempId) : null

    itemsToCreate.push({
      title: item.title,
      description: item.description || "",
      plan: newPlan._id,
      section: targetSectionId || undefined,
      order: item.order || 0,
      status: "todo",
      priority: item.priority || "medium",
      plannedDuration: plannedDur,
      actualDuration: 0,
    })
  }

  if (itemsToCreate.length > 0) {
    await Item.insertMany(itemsToCreate)
  }

  newPlan.totalDuration = totalDuration
  newPlan.completedDuration = 0
  await newPlan.save()

  await newPlan.populate("createdBy", "name email avatar")
  await newPlan.populate("workspace", "name color")

  res.status(201).json(new ApiResponse(201, newPlan, "Plan imported as clean template successfully"))
})

