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
import { withDB } from "../middlewares/db.middleware.js"

const router = express.Router()

router.use(protect)

router.route("/").get(withDB, getSessions).post(withDB, createSession)  
router.post("/generate", withDB, generateSessions)                      
router.route("/:id").put(withDB, updateSession).delete(withDB, deleteSession)  
router.post("/:id/start", withDB, startSession)                         
router.post("/:id/complete", withDB, completeSession)                   

export default router
