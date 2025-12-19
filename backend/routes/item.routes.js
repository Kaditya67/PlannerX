import express from "express"
import { getItems, getItem, createItem, updateItem, reorderItems, deleteItem } from "../controllers/item.controller.js"
import { protect } from "../middlewares/auth.middleware.js"

const router = express.Router()

router.use(protect)

router.route("/").get(getItems).post(createItem)

router.put("/reorder", reorderItems)

router.route("/:id").get(getItem).put(updateItem).delete(deleteItem)

export default router
