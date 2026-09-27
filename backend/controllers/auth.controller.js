import asyncHandler from "express-async-handler"
import connectDB from "../config/db.js"  // Adjust path from api folder
import User from "../models/user.model.js"  // Adjust path from api folder
import Workspace from "../models/workspace.model.js"
import Plan from "../models/plan.model.js"
import Section from "../models/section.model.js"
import Item from "../models/item.model.js"
import Session from "../models/session.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"

// Helper to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateToken()

  const cookieOptions = {
    expires: new Date(Date.now() + Number.parseInt(process.env.COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  }

  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role || "user",
    preferences: user.preferences,
    dailyCapacity: user.dailyCapacity,
  }

  res.status(statusCode).cookie("token", token, cookieOptions).json(
    new ApiResponse(statusCode, { token, user: userData }, "Authentication successful")
  )
}

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  await connectDB();  // 🔥 Serverless DB connection
  
  const { name, email, password } = req.body

  // Validate input
  if (!name || !email || !password) {
    res.status(400)
    throw new Error("Please provide name, email, and password")
  }

  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() })
  if (existingUser) {
    res.status(400)
    throw new Error("User already exists with this email")
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
  })

  // Create default personal workspace for the new user
  await Workspace.create({
    name: "Personal",
    description: "Default personal workspace",
    color: "#10B981",
    icon: "folder",
    owner: user._id,
    members: [],
  })

  sendTokenResponse(user, 201, res)
})

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  await connectDB();  // 🔥 Serverless DB connection
  
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400)
    throw new Error("Please provide email and password")
  }

  const user = await User.findOne({ 
    email: email.toLowerCase(), 
    isDeleted: false 
  }).select("+password")

  if (!user) {
    res.status(401)
    throw new Error("Invalid credentials")
  }

  const isMatch = await user.comparePassword(password)

  if (!isMatch) {
    res.status(401)
    throw new Error("Invalid credentials")
  }

  // Check if user is suspended or deactivated by admin
  if (user.status === "suspended") {
    res.status(403)
    throw new Error(user.statusReason ? `Account suspended: ${user.statusReason}` : "Your account has been suspended by an administrator. Please contact support.")
  }

  if (user.status === "deactivated") {
    res.status(403)
    throw new Error("Your account has been deactivated. Please contact support.")
  }

  // Update lastActiveAt
  user.lastActiveAt = new Date()
  await user.save()

  // If this is the demo account and older than 1 day, reset its experiments
  if (user.email === "demo@planner.com") {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000
    const lastSessionTime = new Date(user.updatedAt || user.createdAt).getTime()
    if (Date.now() - lastSessionTime > ONE_DAY_MS) {
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

      await Workspace.create({
        name: "Personal",
        description: "Default personal workspace",
        color: "#10B981",
        icon: "folder",
        owner: user._id,
        members: [],
      })

      user.updatedAt = new Date()
      await user.save()
    }
  }

  sendTokenResponse(user, 200, res)
})

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  })

  res.status(200).json(
    new ApiResponse(200, null, "Logged out successfully")
  )
})

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  await connectDB();  // 🔥 For consistency
  
  res.status(200).json(
    new ApiResponse(200, { user: req.user }, "User profile fetched successfully")
  )
})

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  await connectDB();  // 🔥 Serverless DB connection
  
  const { name, avatar, preferences, dailyCapacity } = req.body

  const updateData = {}
  if (name) updateData.name = name
  if (avatar !== undefined) updateData.avatar = avatar
  if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences }
  if (dailyCapacity !== undefined) updateData.dailyCapacity = dailyCapacity

  const user = await User.findByIdAndUpdate(
    req.user._id, 
    updateData, 
    { new: true, runValidators: true }
  ).select('-password')

  res.status(200).json(
    new ApiResponse(200, { user }, "Profile updated successfully")
  )
})

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = asyncHandler(async (req, res) => {
  await connectDB();  // 🔥 Serverless DB connection
  
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    res.status(400)
    throw new Error("Please provide current and new password")
  }

  const user = await User.findById(req.user._id).select("+password")

  const isMatch = await user.comparePassword(currentPassword)
  if (!isMatch) {
    res.status(400)
    throw new Error("Current password is incorrect")
  }

  user.password = newPassword
  await user.save()

  sendTokenResponse(user, 200, res)
})

// @desc    1-Click Demo Login (Auto-finds or provisions Demo User)
// @route   POST /api/auth/demo
// @access  Public
export const demoLogin = asyncHandler(async (req, res) => {
  await connectDB()

  const demoEmail = "demo@planner.com"
  const demoPassword = "password123"

  let user = await User.findOne({ email: demoEmail, isDeleted: false }).select("+password")

  const ONE_DAY_MS = 24 * 60 * 60 * 1000
  const now = new Date()

  if (!user) {
    user = await User.create({
      name: "Demo User",
      email: demoEmail,
      password: demoPassword,
    })

    // Ensure default personal workspace
    await Workspace.create({
      name: "Personal",
      description: "Default personal workspace",
      color: "#10B981",
      icon: "folder",
      owner: user._id,
      members: [],
    })
  } else {
    // Check if the user's demo session is older than 1 day
    const lastSessionTime = new Date(user.updatedAt || user.createdAt).getTime()
    const isExpired = Date.now() - lastSessionTime > ONE_DAY_MS

    if (isExpired) {
      // Purge all experimental data created by this demo user
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

      // Re-provision fresh personal workspace
      await Workspace.create({
        name: "Personal",
        description: "Default personal workspace",
        color: "#10B981",
        icon: "folder",
        owner: user._id,
        members: [],
      })

      // Reset password and touch updatedAt so a fresh 1-day window starts
      user.password = demoPassword
      user.updatedAt = now
      await user.save()
    }
  }

  sendTokenResponse(user, 200, res)
})
