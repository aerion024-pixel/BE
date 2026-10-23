import { Router } from "express";
import { createTransaction, getAllTransaction, getTransactionById } from "../controllers/TransactionController.js";
import { verifyToken } from "../middlewares/middleware.js";

const router = Router();

router.use(verifyToken);
router.post("/", createTransaction);
router.get("/", getAllTransaction);
router.get("/:id", getTransactionById);

export default router;