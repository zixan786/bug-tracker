import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  changePassword,
  deleteUser,
} from "../controllers/user.controller";
import { authenticateToken, requireAdmin } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all users (admin only)
router.get("/", requireAdmin, getAllUsers);

// Get user by ID
router.get("/:id", getUserById);

// Update user
router.put("/:id", updateUser);

// Change password
router.put("/:id/password", changePassword);

// Delete user (admin only)
router.delete("/:id", requireAdmin, deleteUser);

export default router;
