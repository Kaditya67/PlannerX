import jwt from "jsonwebtoken"
import asyncHandler from "express-async-handler"
import connectDB from "../config/db.js"  
import User from "../models/user.model.js"

export const protect = asyncHandler(async (req, res, next) => {
  await connectDB(); 
  
  let token

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]
  } else if (req.cookies?.token) {
    token = req.cookies.token
  }

  if (!token) {
    res.status(401)
    throw new Error("Not authorized, no token provided")
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select("-password")

    if (!req.user || req.user.isDeleted) {
      res.status(401)
      throw new Error("User not found or deleted")
    }

    next()
  } catch (error) {
    res.status(401)
    throw new Error("Not authorized, token invalid")
  }
})

export const optionalAuth = asyncHandler(async (req, res, next) => {
  await connectDB();  // 🔥 ADD DB CONNECTION
  
  let token

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1]
  } else if (req.cookies?.token) {
    token = req.cookies.token
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(decoded.id).select("-password")
    } catch (error) {
      // Token invalid, continue without user
    }
  }

  next()
})
