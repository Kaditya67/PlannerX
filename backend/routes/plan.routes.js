import express from "express"
import {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
  getPlanStats,
  importPlanStructure,
  getPlanTemplate,
  clonePlanFromTemplate,
} from "../controllers/plan.controller.js"
import { protect } from "../middlewares/auth.middleware.js"
import { withDB } from "../middlewares/db.middleware.js"

const router = express.Router()

router.use(protect)

router.route("/").get(withDB, getPlans).post(withDB, createPlan)
router.post("/clone-template", withDB, clonePlanFromTemplate)
router.get("/:id/template", withDB, getPlanTemplate)
router.route("/:id").get(withDB, getPlan).put(withDB, updatePlan).delete(withDB, deletePlan)
router.get("/:id/stats", withDB, getPlanStats)

router
  .route("/:id/import")
  .post(protect, importPlanStructure)

export default router
