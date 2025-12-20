import express from "express"
import { register, login, logout, getMe, updateProfile, updatePassword } from "../controllers/auth.controller.js"
import { protect } from "../middlewares/auth.middleware.js"
import { withDB } from "../middlewares/db.middleware.js"  

const router = express.Router()

router.post("/register", withDB, register)      
router.post("/login", withDB, login)           
router.post("/logout", protect, logout)
router.get("/me", protect, withDB, getMe)       
router.put("/me", protect, withDB, updateProfile)  
router.put("/password", protect, withDB, updatePassword)  

export default router
