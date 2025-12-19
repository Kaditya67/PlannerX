import asyncHandler from "express-async-handler"
import Section from "../models/section.model.js"
import Item from "../models/item.model.js"
import Plan from "../models/plan.model.js"

// @desc    Get sections for a plan
// @route   GET /api/sections?plan=:planId
// @access  Private
export const getSections = asyncHandler(async (req, res) => {
  const { plan } = req.query

  const sections = await Section.find({ plan, isDeleted: false }).populate("items").sort({ order: 1 })

  res.status(200).json({ success: true, count: sections.length, data: sections })
})

// @desc    Create section
// @route   POST /api/sections
// @access  Private
export const createSection = asyncHandler(async (req, res) => {
  const { name, description, plan, parentSection, color, startDate, endDate } = req.body

  // Get max order
  const maxOrder = await Section.findOne({ plan, parentSection: parentSection || null })
    .sort({ order: -1 })
    .select("order")

  const section = await Section.create({
    name,
    description,
    plan,
    parentSection,
    color,
    startDate,
    endDate,
    order: maxOrder ? maxOrder.order + 1 : 0,
  })

  res.status(201).json({ success: true, data: section })
})

// @desc    Update section
// @route   PUT /api/sections/:id
// @access  Private
export const updateSection = asyncHandler(async (req, res) => {
  const { name, description, color, startDate, endDate, isCollapsed } = req.body

  let section = await Section.findById(req.params.id)

  if (!section || section.isDeleted) {
    res.status(404)
    throw new Error("Section not found")
  }

  section = await Section.findByIdAndUpdate(
    req.params.id,
    { name, description, color, startDate, endDate, isCollapsed },
    { new: true, runValidators: true },
  )

  res.status(200).json({ success: true, data: section })
})

// @desc    Reorder sections
// @route   PUT /api/sections/reorder
// @access  Private
export const reorderSections = asyncHandler(async (req, res) => {
  const { sections } = req.body // Array of { id, order, parentSection }

  const bulkOps = sections.map(({ id, order, parentSection }) => ({
    updateOne: {
      filter: { _id: id },
      update: { order, parentSection: parentSection || null },
    },
  }))

  await Section.bulkWrite(bulkOps)

  res.status(200).json({ success: true, message: "Sections reordered" })
})

// @desc    Delete section
// @route   DELETE /api/sections/:id
// @access  Private
export const deleteSection = asyncHandler(async (req, res) => {
  const section = await Section.findById(req.params.id)

  if (!section || section.isDeleted) {
    res.status(404)
    throw new Error("Section not found")
  }

  // Soft delete section and items
  section.isDeleted = true
  section.deletedAt = new Date()
  await section.save()

  await Item.updateMany({ section: section._id }, { isDeleted: true, deletedAt: new Date() })

  // Update plan duration
  await recalculatePlanDuration(section.plan)

  res.status(200).json({ success: true, message: "Section deleted" })
})

// Helper function
async function recalculatePlanDuration(planId) {
  const items = await Item.find({ plan: planId, isDeleted: false })
  const totalDuration = items.reduce((acc, item) => acc + (item.plannedDuration || 0), 0)
  const completedDuration = items
    .filter((i) => i.status === "completed")
    .reduce((acc, item) => acc + (item.actualDuration || item.plannedDuration || 0), 0)

  await Plan.findByIdAndUpdate(planId, { totalDuration, completedDuration })
}
