import { Router } from "express";
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getMyProjects,
  addMemberToProject,
} from "../controllers/project.controller";
import { authenticateToken, requireDeveloperOrAdmin, requireProjectTeam } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get my projects
router.get("/my", getMyProjects);

// Get all projects
router.get("/", getAllProjects);

// Get project by ID
router.get("/:id", getProjectById);

// Create project (project managers, developers and admins only)
router.post("/", requireProjectTeam, createProject);

// Update project
router.put("/:id", updateProject);

// Delete project
router.delete("/:id", deleteProject);

//add member to project (only admin, owner can add)
router.post("/:projectId/members/:userId", authenticateToken, addMemberToProject);

export default router;
