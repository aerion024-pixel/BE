import { Router } from "express";
import { createTransaction, getAllTransaction } from "../controllers/transactionCopiController.js";

const router = Router()

router.post("/", createTransaction)
router.get("/", getAllTransaction)

export default router