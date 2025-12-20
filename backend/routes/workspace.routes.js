import express from "express"
import {
  getWorkspaces,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  removeMember,
} from "../controllers/workspace.controller.js"
import { protect } from "../middlewares/auth.middleware.js"
import { withDB } from "../middlewares/db.middleware.js"

const router = express.Router()

router.use(protect)

router.route("/").get(withDB, getWorkspaces).post(withDB, createWorkspace)  
router.route("/:id").get(withDB, getWorkspace).put(withDB, updateWorkspace).delete(withDB, deleteWorkspace)  
router.route("/:id/members").post(withDB, addMember)                        
router.route("/:id/members/:userId").delete(withDB, removeMember)           

export default router
