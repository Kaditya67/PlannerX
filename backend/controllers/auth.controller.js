import asyncHandler from "express-async-handler"
import User from "../models/user.model.js"

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
    preferences: user.preferences,
    dailyCapacity: user.dailyCapacity,
  }

  res.status(statusCode).cookie("token", token, cookieOptions).json({
    success: true,
    token,
    user: userData,
  })
}

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

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

  sendTokenResponse(user, 201, res)
})

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400)
    throw new Error("Please provide email and password")
  }

  const user = await User.findOne({ email: email.toLowerCase(), isDeleted: false }).select("+password")

  if (!user) {
    res.status(401)
    throw new Error("Invalid credentials")
  }

  const isMatch = await user.comparePassword(password)

  if (!isMatch) {
    res.status(401)
    throw new Error("Invalid credentials")
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
  })

  res.status(200).json({ success: true, message: "Logged out successfully" })
})

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user })
})

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar, preferences, dailyCapacity } = req.body

  const updateData = {}
  if (name) updateData.name = name
  if (avatar !== undefined) updateData.avatar = avatar
  if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences }
  if (dailyCapacity !== undefined) updateData.dailyCapacity = dailyCapacity

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({ success: true, user })
})

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

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
