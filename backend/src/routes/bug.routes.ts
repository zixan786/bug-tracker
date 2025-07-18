import { Router } from "express";
import {
  getAllBugs,
  getBugById,
  createBug,
  updateBug,
  deleteBug,
  addComment,
  transitionBugStatus,
  assignBugToQA,
  blockBug,
  unblockBug,
  getBugHistory,
} from "../controllers/bug.controller";
import { authenticateToken, requireDeveloperQAOrAdmin } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all bugs
router.get("/", getAllBugs);

// Get bug by ID
router.get("/:id", getBugById);

// Create bug
router.post("/", createBug);

// Update bug
router.put("/:id", updateBug);

// Delete bug
router.delete("/:id", deleteBug);

// Add comment to bug
router.post("/:id/comments", addComment);

// Enhanced workflow endpoints
router.put("/:id/status", requireDeveloperQAOrAdmin, transitionBugStatus);
router.put("/:id/qa-assign", requireDeveloperQAOrAdmin, assignBugToQA);
router.put("/:id/block", requireDeveloperQAOrAdmin, blockBug);
router.put("/:id/unblock", requireDeveloperQAOrAdmin, unblockBug);
router.get("/:id/history", getBugHistory);

export default router;
