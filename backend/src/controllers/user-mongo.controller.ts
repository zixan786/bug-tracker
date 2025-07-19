import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth-mongo.middleware';
import { User } from '../models/mongoose/User';
import { OrganizationMember } from '../models/mongoose/OrganizationMember';

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUser = req.user;
    if (!currentUser) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // For super admin, support organization filtering
    if (currentUser.role === 'admin' && currentUser.email === 'admin@bugtracker.com') {
      const { organizationId } = req.query;

      if (organizationId) {
        // Return users for specific organization
        console.log('🔍 Super admin requesting users for organization:', organizationId);

        const memberships = await OrganizationMember.find({
          organizationId: organizationId,
          status: 'active'
        }).populate('userId', '-password');

        const users = memberships.map(membership => {
          const user = membership.userId as any;
          return {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            organizationRole: membership.role
          };
        });

        console.log('✅ Found', users.length, 'users for organization', organizationId);

        res.json({
          success: true,
          data: { users }
        });
        return;
      } else {
        // Return all users (system-wide view)
        console.log('🔍 Super admin requesting all users (system-wide)');
        const users = await User.find({}, '-password');
        res.json({
          success: true,
          data: {
            users: users.map(user => ({
              id: user._id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
              isActive: user.isActive,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt
            }))
          }
        });
        return;
      }
    }

    // For tenant users, return users from their organizations
    const memberships = await OrganizationMember.find({ 
      userId: currentUser._id,
      status: 'active'
    });

    if (memberships.length === 0) {
      res.json({
        success: true,
        data: { users: [] }
      });
      return;
    }

    const organizationIds = memberships.map(m => m.organizationId);
    const orgMemberships = await OrganizationMember.find({
      organizationId: { $in: organizationIds },
      status: 'active'
    }).populate('userId', '-password');

    const users = orgMemberships.map(membership => {
      const user = membership.userId as any;
      return {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        organizationRole: membership.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    });

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, '-password');
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { firstName, lastName, email },
      { new: true, select: '-password' }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(501).json({
      success: false,
      message: 'Password change not implemented yet'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Delete user and related data
    await Promise.all([
      User.findByIdAndDelete(id),
      OrganizationMember.deleteMany({ userId: id })
    ]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
