import { Router } from "express";
import { getAllProducts, getProByID, createProduct, updateProduct, deleteProduct } from "../controllers/ProductController.js";

const router = Router()

router.get("/", getAllProducts)
router.get("/:id", getProByID)
router.post("/", createProduct)
router.put("/:id", updateProduct)
router.delete("/:id", deleteProduct)



export default router