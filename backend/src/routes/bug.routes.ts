import { Router } from "express";
import {
  getAllBugs,
  getBugById,
  createBug,
  updateBug,
  deleteBug,
  updateBugStatus,
} from "../controllers/bug-mongo.controller";
import { authenticateToken } from "../middlewares/auth-mongo.middleware";

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

// Update bug status
router.put("/:id/status", updateBugStatus);

// TODO: Implement additional workflow endpoints
// router.post("/:id/comments", addComment);
// router.put("/:id/qa-assign", assignBugToQA);
// router.put("/:id/block", blockBug);
// router.put("/:id/unblock", unblockBug);
// router.get("/:id/history", getBugHistory);

export default router;
