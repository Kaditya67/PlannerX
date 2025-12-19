import express from "express"
import {
  getSections,
  createSection,
  updateSection,
  reorderSections,
  deleteSection,
} from "../controllers/section.controller.js"
import { protect } from "../middlewares/auth.middleware.js"

const router = express.Router()

router.use(protect)

router.route("/").get(getSections).post(createSection)

router.put("/reorder", reorderSections)

router.route("/:id").put(updateSection).delete(deleteSection)

export default router
