import { Router } from "express";
import { getAllProducts, getProByID } from "../controllers/ProductController.js";

const router = Router()

router.get("/", getAllProducts)
router.get("/:id", getProByID)

export default router