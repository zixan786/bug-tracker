import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { Bug } from "../models/Bug";
import { Project } from "../models/Project";
import { Comment } from "../models/Comment";
import { BugHistory } from "../models/BugHistory";
import { ApiError } from "../middlewares/error.middleware";
import { AuthRequest } from "../middlewares/auth.middleware";
import { BugWorkflowService } from "../services/BugWorkflowService";
import {
  createBugSchema,
  updateBugSchema,
  bugFilterSchema,
  createCommentSchema
} from "../utils/validation";

const bugRepository = AppDataSource.getRepository(Bug);
const projectRepository = AppDataSource.getRepository(Project);
const commentRepository = AppDataSource.getRepository(Comment);
const bugHistoryRepository = AppDataSource.getRepository(BugHistory);
const bugWorkflowService = new BugWorkflowService();

export const getAllBugs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "DESC",
      status,
      priority,
      severity,
      type,
      projectId,
      assigneeId,
      reporterId,
      search,
    } = bugFilterSchema.parse(req.query);

    const queryBuilder = bugRepository
      .createQueryBuilder("bug")
      .leftJoinAndSelect("bug.project", "project")
      .leftJoinAndSelect("bug.reporter", "reporter")
      .leftJoinAndSelect("bug.assignee", "assignee");

    // Apply filters
    if (status) queryBuilder.andWhere("bug.status = :status", { status });
    if (priority) queryBuilder.andWhere("bug.priority = :priority", { priority });
    if (severity) queryBuilder.andWhere("bug.severity = :severity", { severity });
    if (type) queryBuilder.andWhere("bug.type = :type", { type });
    if (projectId) queryBuilder.andWhere("bug.projectId = :projectId", { projectId });
    if (assigneeId) queryBuilder.andWhere("bug.assigneeId = :assigneeId", { assigneeId });
    if (reporterId) queryBuilder.andWhere("bug.reporterId = :reporterId", { reporterId });
    if (search) {
      queryBuilder.andWhere(
        "(bug.title ILIKE :search OR bug.description ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    const [bugs, total] = await queryBuilder
      .orderBy(`bug.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    res.json({
      success: true,
      data: {
        bugs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getBugById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const bug = await bugRepository.findOne({
      where: { id: parseInt(id) },
      relations: [
        "project",
        "reporter",
        "assignee",
        "comments",
        "comments.author",
        "attachments",
      ],
    });

    if (!bug) {
      throw new ApiError(404, "Bug not found");
    }

    res.json({
      success: true,
      data: { bug },
    });
  } catch (error) {
    next(error);
  }
};

export const createBug = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createBugSchema.parse(req.body);

    // Check if project exists
    const project = await projectRepository.findOne({
      where: { id: validatedData.projectId },
    });

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    // Create bug
    const bug = bugRepository.create({
      ...validatedData,
      reporterId: req.user!.id,
    });

    await bugRepository.save(bug);

    // Fetch the complete bug with relations
    const savedBug = await bugRepository.findOne({
      where: { id: bug.id },
      relations: ["project", "reporter", "assignee"],
    });

    res.status(201).json({
      success: true,
      message: "Bug created successfully",
      data: { bug: savedBug },
    });
  } catch (error) {
    next(error);
  }
};

export const updateBug = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const validatedData = updateBugSchema.parse(req.body);

    const bug = await bugRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["project", "reporter", "assignee"],
    });

    if (!bug) {
      throw new ApiError(404, "Bug not found");
    }

    // Update bug
    Object.assign(bug, validatedData);
    await bugRepository.save(bug);

    res.json({
      success: true,
      message: "Bug updated successfully",
      data: { bug },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBug = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const bug = await bugRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["reporter"],
    });

    if (!bug) {
      throw new ApiError(404, "Bug not found");
    }

    // Only reporter or admin can delete
    if (bug.reporterId !== req.user!.id && req.user!.role !== "admin") {
      throw new ApiError(403, "Not authorized to delete this bug");
    }

    await bugRepository.remove(bug);

    res.json({
      success: true,
      message: "Bug deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const validatedData = createCommentSchema.parse(req.body);

    const bug = await bugRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!bug) {
      throw new ApiError(404, "Bug not found");
    }

    const comment = commentRepository.create({
      ...validatedData,
      bugId: bug.id,
      authorId: req.user!.id,
    });

    await commentRepository.save(comment);

    // Fetch the complete comment with relations
    const savedComment = await commentRepository.findOne({
      where: { id: comment.id },
      relations: ["author"],
    });

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: { comment: savedComment },
    });
  } catch (error) {
    next(error);
  }
};

// Enhanced workflow endpoints
export const transitionBugStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const bug = await bugWorkflowService.transitionBugStatus(
      parseInt(id),
      status,
      req.user!,
      notes
    );

    res.json({
      success: true,
      message: "Bug status updated successfully",
      data: { bug },
    });
  } catch (error) {
    next(error);
  }
};

export const assignBugToQA = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { qaUserId } = req.body;

    const bug = await bugWorkflowService.assignBugToQA(
      parseInt(id),
      qaUserId,
      req.user!
    );

    res.json({
      success: true,
      message: "Bug assigned to QA successfully",
      data: { bug },
    });
  } catch (error) {
    next(error);
  }
};

export const blockBug = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { blockedByBugId, reason } = req.body;

    const bug = await bugWorkflowService.blockBug(
      parseInt(id),
      blockedByBugId,
      req.user!,
      reason
    );

    res.json({
      success: true,
      message: "Bug blocked successfully",
      data: { bug },
    });
  } catch (error) {
    next(error);
  }
};

export const unblockBug = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const bug = await bugWorkflowService.unblockBug(
      parseInt(id),
      req.user!,
      reason
    );

    res.json({
      success: true,
      message: "Bug unblocked successfully",
      data: { bug },
    });
  } catch (error) {
    next(error);
  }
};

export const getBugHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const history = await bugWorkflowService.getBugHistory(parseInt(id));

    res.json({
      success: true,
      data: { history },
    });
  } catch (error) {
    next(error);
  }
};
