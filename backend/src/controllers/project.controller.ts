import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { Project, ProjectStatus } from "../models/Project";
import { User } from "../models/User";
import { ApiError } from "../middlewares/error.middleware";
import { AuthRequest } from "../middlewares/auth.middleware";
import { createProjectSchema, updateProjectSchema, paginationSchema } from "../utils/validation";

const projectRepository = AppDataSource.getRepository(Project);
const userRepository = AppDataSource.getRepository(User);

export const getAllProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "DESC" } = 
      paginationSchema.parse(req.query);

    const [projects, total] = await projectRepository.findAndCount({
      relations: ["owner", "members"],
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      success: true,
      data: {
        projects,
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

export const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const project = await projectRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["owner", "members", "bugs"],
    });

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    res.json({
      success: true,
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createProjectSchema.parse(req.body);
    const { memberIds, ...projectData } = validatedData;

    // Create project
    const project = projectRepository.create({
      ...projectData,
      ownerId: req.user!.id,
    });

    // Add members if provided
    if (memberIds && memberIds.length > 0) {
      const members = await userRepository.findByIds(memberIds);
      project.members = members;
    }

    await projectRepository.save(project);

    // Fetch the complete project with relations
    const savedProject = await projectRepository.findOne({
      where: { id: project.id },
      relations: ["owner", "members"],
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: { project: savedProject },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const validatedData = updateProjectSchema.parse(req.body);
    const { memberIds, ...projectData } = validatedData;

    const project = await projectRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["owner", "members"],
    });

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    // Check if user is owner or admin
    if (project.ownerId !== req.user!.id && req.user!.role !== "admin") {
      throw new ApiError(403, "Not authorized to update this project");
    }

    // Update project data
    Object.assign(project, projectData);

    // Update members if provided
    if (memberIds !== undefined) {
      if (memberIds.length > 0) {
        const members = await userRepository.findByIds(memberIds);
        project.members = members;
      } else {
        project.members = [];
      }
    }

    await projectRepository.save(project);

    res.json({
      success: true,
      message: "Project updated successfully",
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const project = await projectRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["owner"],
    });

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    // Check if user is owner or admin
    if (project.ownerId !== req.user!.id && req.user!.role !== "admin") {
      throw new ApiError(403, "Not authorized to delete this project");
    }

    await projectRepository.remove(project);

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getMyProjects = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10 } = paginationSchema.parse(req.query);

    const [projects, total] = await projectRepository
      .createQueryBuilder("project")
      .leftJoinAndSelect("project.owner", "owner")
      .leftJoinAndSelect("project.members", "members")
      .where("project.ownerId = :userId", { userId: req.user!.id })
      .orWhere("members.id = :userId", { userId: req.user!.id })
      .orderBy("project.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    res.json({
      success: true,
      data: {
        projects,
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


export const addMemberToProject = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId, userId } = req.params;

    const project = await projectRepository.findOne({
      where: { id: parseInt(projectId) },
      relations: ["members", "owner"],
    });
    if (!project) throw new ApiError(404, "Project not found");

    // Only owner or admin can add members
    if (project.ownerId !== req.user!.id && req.user!.role !== "admin") {
      throw new ApiError(403, "Not authorized to add members");
    }

    const user = await userRepository.findOne({ where: { id: parseInt(userId) } });
    if (!user) throw new ApiError(404, "User not found");

    // Add user if not already a member
    if (!project.members.some(m => m.id === user.id)) {
      project.members.push(user);
      await projectRepository.save(project);
    }

    res.json({
      success: true,
      message: "Member added to project",
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};
