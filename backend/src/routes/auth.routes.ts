import { Router } from "express";
import { register, login, getProfile, refreshToken } from "../controllers/auth.controller";
import { authenticateToken } from "../middlewares/auth.middleware";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.get("/profile", authenticateToken, getProfile);
router.post("/refresh", authenticateToken, refreshToken);

export default router;
