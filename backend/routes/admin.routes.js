import express from "express"
import {
  getSystemStats,
  getAllUsers,
  updateUserByAdmin,
  resetUserPassword,
  wipeUserData,
  deleteUserByAdmin,
} from "../controllers/admin.controller.js"
import { protect, admin } from "../middlewares/auth.middleware.js"
import { withDB } from "../middlewares/db.middleware.js"

const router = express.Router()

// All admin routes require authentication and admin role
router.use(protect, admin, withDB)

router.get("/stats", getSystemStats)
router.get("/users", getAllUsers)
router.patch("/users/:userId", updateUserByAdmin)
router.post("/users/:userId/reset-password", resetUserPassword)
router.post("/users/:userId/wipe-data", wipeUserData)
router.delete("/users/:userId", deleteUserByAdmin)

export default router
