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

const router = express.Router()

router.use(protect)

router.route("/").get(getWorkspaces).post(createWorkspace)

router.route("/:id").get(getWorkspace).put(updateWorkspace).delete(deleteWorkspace)

router.route("/:id/members").post(addMember)

router.route("/:id/members/:userId").delete(removeMember)

export default router
