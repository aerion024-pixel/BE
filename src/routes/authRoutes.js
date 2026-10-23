import { Router } from "express";
import { login} from "../controllers/AuthController.js";
import { validate } from "../middlewares/validationMiddleware.js";
import { loginSchema } from "../validation/authValidation.js";

const router = Router();

router.post('/login', validate(loginSchema), login);


export default router;