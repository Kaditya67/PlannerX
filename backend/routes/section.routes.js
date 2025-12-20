import express from "express"
import {
  getSections,
  createSection,
  updateSection,
  reorderSections,
  deleteSection,
} from "../controllers/section.controller.js"
import { protect } from "../middlewares/auth.middleware.js"
import { withDB } from "../middlewares/db.middleware.js"

const router = express.Router()

router.use(protect)

router.route("/").get(withDB, getSections).post(withDB, createSection)  
router.put("/reorder", withDB, reorderSections)                         
router.route("/:id").put(withDB, updateSection).delete(withDB, deleteSection)  

export default router
