import { Router } from "express";
import { createTransaction } from "../controllers/TransactionController.js";

const router = Router()

router.post("/", createTransaction)
export default router