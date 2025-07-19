import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User, UserRole } from "../models/User";
import { OrganizationMember, MemberStatus } from "../models/OrganizationMember";
import { Organization } from "../models/Organization";
import { ApiError } from "../middlewares/error.middleware";
import { config } from "../config";
import { registerSchema, loginSchema } from "../utils/validation";

const userRepository = AppDataSource.getRepository(User);

const generateToken = (userId: number): string => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await userRepository.findOne({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      throw new ApiError(400, "User with this email already exists");
    }

    // Create new user
    const user = userRepository.create({
      ...validatedData,
      role: validatedData.role || UserRole.VIEWER,
    });

    await userRepository.save(user);

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user by email
    const user = await userRepository.findOne({
      where: { email: validatedData.email },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Check password
    const isPasswordValid = await user.comparePassword(validatedData.password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Get user's organizations
    const memberRepository = AppDataSource.getRepository(OrganizationMember);
    const organizationRepository = AppDataSource.getRepository(Organization);

    const memberships = await memberRepository.find({
      where: {
        userId: user.id,
        status: MemberStatus.ACTIVE
      },
      relations: ['organization'],
      order: { joinedAt: 'ASC' }
    });

    const organizations = memberships.map(membership => ({
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      role: membership.role,
      subscriptionStatus: membership.organization.subscriptionStatus,
      trialEndsAt: membership.organization.trialEndsAt,
      userCount: 0, // Will be populated by frontend if needed
      projectCount: 0, // Will be populated by frontend if needed
      bugCount: 0 // Will be populated by frontend if needed
    }));

    // Determine if this is a system admin or tenant user
    const isSystemAdmin = user.role === UserRole.ADMIN && user.email === 'admin@bugtracker.com';

    // For tenant users, set their primary organization
    let primaryOrganization = null;
    if (!isSystemAdmin && organizations.length > 0) {
      primaryOrganization = organizations[0]; // Use first organization as primary
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          ...user.toJSON(),
          isSystemAdmin
        },
        token,
        organizations,
        primaryOrganization
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    res.json({
      success: true,
      data: { user: user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: { token },
    });
  } catch (error) {
    next(error);
  }
};
