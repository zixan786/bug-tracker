import { Router } from "express";
import { register, login, me, logout } from "../controllers/auth-mongo.controller";
import { authenticateToken } from "../middlewares/auth-mongo.middleware";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/me", authenticateToken, me);
router.post("/logout", authenticateToken, logout);

export default router;
