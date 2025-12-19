import express from "express"
import {
  getSessions,
  createSession,
  updateSession,
  startSession,
  completeSession,
  deleteSession,
  generateSessions,
} from "../controllers/session.controller.js"
import { protect } from "../middlewares/auth.middleware.js"

const router = express.Router()

router.use(protect)

router.route("/").get(getSessions).post(createSession)

router.post("/generate", generateSessions)

router.route("/:id").put(updateSession).delete(deleteSession)

router.post("/:id/start", startSession)
router.post("/:id/complete", completeSession)

export default router
