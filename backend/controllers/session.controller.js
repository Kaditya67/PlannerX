import asyncHandler from "express-async-handler"
import Session from "../models/session.model.js"
import Item from "../models/item.model.js"
import connectDB from "../config/db.js"

// @desc    Get sessions
// @route   GET /api/sessions?plan=:planId&date=:date
// @access  Private
export const getSessions = asyncHandler(async (req, res) => {
  await connectDB();
  const { plan, item, startDate, endDate } = req.query

  const query = { user: req.user._id, isDeleted: false }
  if (plan) query.plan = plan
  if (item) query.item = item

  if (startDate || endDate) {
    query.scheduledStart = {}
    if (startDate) query.scheduledStart.$gte = new Date(startDate)
    if (endDate) query.scheduledStart.$lte = new Date(endDate)
  }

  const sessions = await Session.find(query)
    .populate("item", "title status priority")
    .populate("plan", "name color")
    .sort({ scheduledStart: 1 })

  res.status(200).json({ success: true, count: sessions.length, data: sessions })
})

// @desc    Create session
// @route   POST /api/sessions
// @access  Private
export const createSession = asyncHandler(async (req, res) => {
  await connectDB();
  const { item, plan, scheduledStart, scheduledEnd, plannedDuration, notes } = req.body

  const session = await Session.create({
    item,
    plan,
    user: req.user._id,
    scheduledStart,
    scheduledEnd,
    plannedDuration,
    notes,
  })

  await session.populate("item", "title status priority")

  res.status(201).json({ success: true, data: session })
})

// @desc    Update session
// @route   PUT /api/sessions/:id
// @access  Private
export const updateSession = asyncHandler(async (req, res) => {
  await connectDB();
  const { scheduledStart, scheduledEnd, actualStart, actualEnd, actualDuration, status, notes } = req.body

  let session = await Session.findById(req.params.id)

  if (!session || session.isDeleted) {
    res.status(404)
    throw new Error("Session not found")
  }

  if (session.user.toString() !== req.user._id.toString()) {
    res.status(403)
    throw new Error("Not authorized")
  }

  session = await Session.findByIdAndUpdate(
    req.params.id,
    {
      scheduledStart,
      scheduledEnd,
      actualStart,
      actualEnd,
      actualDuration,
      status,
      notes,
    },
    { new: true, runValidators: true },
  ).populate("item", "title status priority")

  // Update item actual duration if session completed
  if (status === "completed" && actualDuration) {
    await Item.findByIdAndUpdate(session.item, {
      $inc: { actualDuration: actualDuration },
    })
  }

  res.status(200).json({ success: true, data: session })
})

// @desc    Start session
// @route   POST /api/sessions/:id/start
// @access  Private
export const startSession = asyncHandler(async (req, res) => {
  await connectDB();
  const session = await Session.findById(req.params.id)

  if (!session || session.isDeleted) {
    res.status(404)
    throw new Error("Session not found")
  }

  session.actualStart = new Date()
  session.status = "in_progress"
  await session.save()

  // Update item status
  await Item.findByIdAndUpdate(session.item, { status: "in_progress" })

  res.status(200).json({ success: true, data: session })
})

// @desc    Complete session
// @route   POST /api/sessions/:id/complete
// @access  Private
export const completeSession = asyncHandler(async (req, res) => {
  await connectDB();
  const session = await Session.findById(req.params.id)

  if (!session || session.isDeleted) {
    res.status(404)
    throw new Error("Session not found")
  }

  const now = new Date()
  session.actualEnd = now
  session.status = "completed"

  if (session.actualStart) {
    session.actualDuration = Math.round((now - session.actualStart) / 60000) // Convert to minutes
  }

  await session.save()

  // Update item actual duration
  await Item.findByIdAndUpdate(session.item, {
    $inc: { actualDuration: session.actualDuration },
  })

  res.status(200).json({ success: true, data: session })
})

// @desc    Delete session
// @route   DELETE /api/sessions/:id
// @access  Private
export const deleteSession = asyncHandler(async (req, res) => {
  await connectDB();
  const session = await Session.findById(req.params.id)

  if (!session || session.isDeleted) {
    res.status(404)
    throw new Error("Session not found")
  }

  if (session.user.toString() !== req.user._id.toString()) {
    res.status(403)
    throw new Error("Not authorized")
  }

  session.isDeleted = true
  session.deletedAt = new Date()
  await session.save()

  res.status(200).json({ success: true, message: "Session deleted" })
})

// @desc    Generate sessions for an item
// @route   POST /api/sessions/generate
// @access  Private
export const generateSessions = asyncHandler(async (req, res) => {
  await connectDB();
  const { itemId, sessionDuration = 60, startDate } = req.body

  const item = await Item.findById(itemId)

  if (!item || item.isDeleted) {
    res.status(404)
    throw new Error("Item not found")
  }

  const totalDuration = item.plannedDuration || 60
  const sessionsCount = Math.ceil(totalDuration / sessionDuration)

  const currentDate = new Date(startDate || Date.now())
  const sessions = []

  for (let i = 0; i < sessionsCount; i++) {
    const scheduledStart = new Date(currentDate)
    const scheduledEnd = new Date(currentDate.getTime() + sessionDuration * 60000)

    sessions.push({
      item: item._id,
      plan: item.plan,
      user: req.user._id,
      scheduledStart,
      scheduledEnd,
      plannedDuration: sessionDuration,
    })

    // Move to next day for simplicity
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const createdSessions = await Session.insertMany(sessions)

  res.status(201).json({ success: true, count: createdSessions.length, data: createdSessions })
})
