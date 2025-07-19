import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../models/mongoose/User";
import { OrganizationMember } from "../models/mongoose/OrganizationMember";
import { Organization } from "../models/mongoose/Organization";
import { config } from "../config";

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  } as jwt.SignOptions);
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role, organizationId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'user'
    });

    // If organizationId is provided, add user to organization
    if (organizationId) {
      console.log('🔗 Adding user to organization:', organizationId);
      await OrganizationMember.create({
        userId: user._id,
        organizationId: organizationId,
        role: 'member', // Default role in organization
        status: 'active'
      });
      console.log('✅ User added to organization successfully');
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    // Get user's organizations
    const memberships = await OrganizationMember.find({ 
      userId: user._id,
      status: 'active'
    }).populate('organizationId');

    const organizations = memberships.map(membership => ({
      id: membership.organizationId._id,
      name: (membership.organizationId as any).name,
      slug: (membership.organizationId as any).slug,
      role: membership.role
    }));

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          lastLoginAt: user.lastLoginAt
        },
        token,
        organizations
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Get user's organizations
    const memberships = await OrganizationMember.find({ 
      userId: user._id,
      status: 'active'
    }).populate('organizationId');

    const organizations = memberships.map(membership => ({
      id: membership.organizationId._id,
      name: (membership.organizationId as any).name,
      slug: (membership.organizationId as any).slug,
      role: membership.role
    }));

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          lastLoginAt: user.lastLoginAt
        },
        organizations
      }
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  // For JWT, logout is handled client-side by removing the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};
