import express from "express"
import { getItems, getItem, createItem, updateItem, reorderItems, deleteItem } from "../controllers/item.controller.js"
import { protect } from "../middlewares/auth.middleware.js"
import { withDB } from "../middlewares/db.middleware.js"

const router = express.Router()

router.use(protect)

router.route("/").get(withDB, getItems).post(withDB, createItem)  
router.put("/reorder", withDB, reorderItems)                     
router.route("/:id").get(withDB, getItem).put(withDB, updateItem).delete(withDB, deleteItem) 

export default router
