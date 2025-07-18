import { z } from "zod";
import { UserRole, BugStatus, BugPriority, BugSeverity, BugType } from "../models";

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.nativeEnum(UserRole).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// User schemas
export const updateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  repository: z.string().url().optional().or(z.literal("")),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  memberIds: z.array(z.number()).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// Bug schemas
export const createBugSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  projectId: z.number().positive("Project ID is required"),
  priority: z.nativeEnum(BugPriority).optional(),
  severity: z.nativeEnum(BugSeverity).optional(),
  type: z.nativeEnum(BugType).optional(),
  stepsToReproduce: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  environment: z.string().optional(),
  browserVersion: z.string().optional(),
  operatingSystem: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  assigneeId: z.number().positive().optional(),
});

export const updateBugSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  status: z.nativeEnum(BugStatus).optional(),
  priority: z.nativeEnum(BugPriority).optional(),
  severity: z.nativeEnum(BugSeverity).optional(),
  type: z.nativeEnum(BugType).optional(),
  stepsToReproduce: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  environment: z.string().optional(),
  browserVersion: z.string().optional(),
  operatingSystem: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
  assigneeId: z.number().positive().optional(),
});

// Comment schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
  isInternal: z.boolean().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
  isInternal: z.boolean().optional(),
});

// Query schemas
export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().positive().max(100)).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["ASC", "DESC"]).optional(),
});

export const bugFilterSchema = paginationSchema.extend({
  status: z.nativeEnum(BugStatus).optional(),
  priority: z.nativeEnum(BugPriority).optional(),
  severity: z.nativeEnum(BugSeverity).optional(),
  type: z.nativeEnum(BugType).optional(),
  projectId: z.string().transform(Number).pipe(z.number().positive()).optional(),
  assigneeId: z.string().transform(Number).pipe(z.number().positive()).optional(),
  reporterId: z.string().transform(Number).pipe(z.number().positive()).optional(),
  search: z.string().optional(),
});
