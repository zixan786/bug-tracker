import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { ApiError } from "../middlewares/error.middleware";
import { AuthRequest } from "../middlewares/auth.middleware";
import { updateUserSchema, changePasswordSchema, paginationSchema } from "../utils/validation";

const userRepository = AppDataSource.getRepository(User);

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "DESC" } = 
      paginationSchema.parse(req.query);

    const [users, total] = await userRepository.findAndCount({
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      success: true,
      data: {
        users: users.map(user => user.toJSON()),
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

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user = await userRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.json({
      success: true,
      data: { user: user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const validatedData = updateUserSchema.parse(req.body);

    const user = await userRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Only allow users to update themselves or admins to update anyone
    if (req.user?.id !== user.id && req.user?.role !== "admin") {
      throw new ApiError(403, "Not authorized to update this user");
    }

    Object.assign(user, validatedData);
    await userRepository.save(user);

    res.json({
      success: true,
      message: "User updated successfully",
      data: { user: user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const validatedData = changePasswordSchema.parse(req.body);

    const user = await userRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Only allow users to change their own password
    if (req.user?.id !== user.id) {
      throw new ApiError(403, "Not authorized to change this user's password");
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(
      validatedData.currentPassword
    );
    if (!isCurrentPasswordValid) {
      throw new ApiError(400, "Current password is incorrect");
    }

    // Update password
    user.password = validatedData.newPassword;
    await userRepository.save(user);

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user = await userRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    await userRepository.save(user);

    res.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};
