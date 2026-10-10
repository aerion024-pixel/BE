import { Router } from "express";
import { createCat, deleteCat, getAllCategories, getCatByID, updateCat} from "../controllers/CategoryController.js";

const router = Router()

router.get("/", getAllCategories)
router.get("/:id", getCatByID)
router.post("/", createCat)
router.put("/:id", updateCat)
router.delete("/:id", deleteCat)

export default router