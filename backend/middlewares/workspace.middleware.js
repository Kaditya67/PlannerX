import asyncHandler from "express-async-handler"
import Workspace from "../models/workspace.model.js"
import { WORKSPACE_ROLES } from "../config/constants.js"

export const checkWorkspaceAccess = (requiredRoles = []) => {
  return asyncHandler(async (req, res, next) => {
    const workspaceId = req.params.workspaceId || req.body.workspace

    if (!workspaceId) {
      res.status(400)
      throw new Error("Workspace ID is required")
    }

    const workspace = await Workspace.findById(workspaceId)

    if (!workspace || workspace.isDeleted) {
      res.status(404)
      throw new Error("Workspace not found")
    }

    // Check if user is owner
    if (workspace.owner.toString() === req.user._id.toString()) {
      req.workspace = workspace
      req.workspaceRole = WORKSPACE_ROLES.OWNER
      return next()
    }

    // Check if user is member
    const member = workspace.members.find((m) => m.user.toString() === req.user._id.toString())

    if (!member) {
      res.status(403)
      throw new Error("Not authorized to access this workspace")
    }

    // Check role if required
    if (requiredRoles.length > 0 && !requiredRoles.includes(member.role)) {
      res.status(403)
      throw new Error("Insufficient permissions")
    }

    req.workspace = workspace
    req.workspaceRole = member.role
    next()
  })
}
