import express from "express"
import { getPlans, getPlan, createPlan, updatePlan, deletePlan, getPlanStats } from "../controllers/plan.controller.js"
import { protect } from "../middlewares/auth.middleware.js"

const router = express.Router()

router.use(protect)

router.route("/").get(getPlans).post(createPlan)

router.route("/:id").get(getPlan).put(updatePlan).delete(deletePlan)

router.get("/:id/stats", getPlanStats)

export default router
