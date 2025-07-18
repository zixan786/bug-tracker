import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AppDataSource } from "../config/database";
import { User, UserRole } from "../models/User";
import { ApiError } from "./error.middleware";

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Access token required");
    }

    const decoded = jwt.verify(token, config.jwt.secret) as { userId: number };
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.userId, isActive: true },
    });

    if (!user) {
      throw new ApiError(401, "Invalid token or user not found");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, "Invalid token"));
    } else {
      next(error);
    }
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Insufficient permissions"));
    }

    next();
  };
};

export const requireAdmin = requireRole([UserRole.ADMIN]);

export const requireDeveloperOrAdmin = requireRole([
  UserRole.ADMIN,
  UserRole.DEVELOPER,
]);

export const requireProjectManagerOrAdmin = requireRole([
  UserRole.ADMIN,
  UserRole.PROJECT_MANAGER,
]);

export const requireQAOrAdmin = requireRole([
  UserRole.ADMIN,
  UserRole.QA,
  UserRole.TESTER,
]);

export const requireDeveloperQAOrAdmin = requireRole([
  UserRole.ADMIN,
  UserRole.DEVELOPER,
  UserRole.QA,
  UserRole.TESTER,
]);

export const requireProjectTeam = requireRole([
  UserRole.ADMIN,
  UserRole.PROJECT_MANAGER,
  UserRole.DEVELOPER,
  UserRole.QA,
  UserRole.TESTER,
]);

// Helper function to check if user can manage projects
export const canManageProjects = (role: UserRole): boolean => {
  return [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.DEVELOPER].includes(role);
};

// Helper function to check if user can manage bugs
export const canManageBugs = (role: UserRole): boolean => {
  return [UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.DEVELOPER, UserRole.QA, UserRole.TESTER].includes(role);
};

// Helper function to check if user can view sensitive data
export const canViewSensitiveData = (role: UserRole): boolean => {
  return [UserRole.ADMIN, UserRole.PROJECT_MANAGER].includes(role);
};
