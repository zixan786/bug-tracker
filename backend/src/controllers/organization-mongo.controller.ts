import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth-mongo.middleware';
import { Organization } from '../models/mongoose/Organization';
import { OrganizationMember } from '../models/mongoose/OrganizationMember';
import { User } from '../models/mongoose/User';

export class OrganizationController {
  static async getUserOrganizations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Get user's organization memberships
      const memberships = await OrganizationMember.find({ 
        userId: user._id,
        status: 'active'
      }).populate('organizationId');

      const organizations = memberships.map(membership => {
        const org = membership.organizationId as any;
        return {
          id: org._id,
          name: org.name,
          slug: org.slug,
          role: membership.role,
          subscriptionStatus: org.subscriptionStatus,
          trialEndsAt: org.trialEndsAt,
          createdAt: org.createdAt
        };
      });

      res.json({
        success: true,
        data: {
          organizations
        }
      });
    } catch (error) {
      console.error('Get user organizations error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { name, slug } = req.body;

      if (!name || !slug) {
        res.status(400).json({
          success: false,
          message: 'Name and slug are required'
        });
        return;
      }

      // Check if slug already exists
      const existingOrg = await Organization.findOne({ slug });
      if (existingOrg) {
        res.status(400).json({
          success: false,
          message: 'Organization slug is already taken'
        });
        return;
      }

      // Create organization
      const organization = await Organization.create({
        name,
        slug,
        ownerId: user._id,
        subscriptionStatus: 'trial',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
      });

      // Add creator as owner member
      await OrganizationMember.create({
        organizationId: organization._id,
        userId: user._id,
        role: 'owner',
        status: 'active'
      });

      res.status(201).json({
        success: true,
        data: {
          organization: {
            id: organization._id,
            name: organization.name,
            slug: organization.slug,
            subscriptionStatus: organization.subscriptionStatus,
            trialEndsAt: organization.trialEndsAt,
            createdAt: organization.createdAt
          }
        }
      });
    } catch (error) {
      console.error('Create organization error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getOrganization(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      const { organizationId } = req.params;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Check if user is member of the organization
      const membership = await OrganizationMember.findOne({
        organizationId,
        userId: user._id,
        status: 'active'
      });

      if (!membership) {
        res.status(403).json({
          success: false,
          message: 'Access denied: Not a member of this organization'
        });
        return;
      }

      // Get organization details
      const organization = await Organization.findById(organizationId).populate('ownerId', 'firstName lastName email');

      if (!organization) {
        res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          organization: {
            id: organization._id,
            name: organization.name,
            slug: organization.slug,
            domain: organization.domain,
            subscriptionStatus: organization.subscriptionStatus,
            trialEndsAt: organization.trialEndsAt,
            owner: organization.ownerId,
            settings: organization.settings,
            createdAt: organization.createdAt,
            updatedAt: organization.updatedAt
          },
          membership: {
            role: membership.role,
            joinedAt: membership.joinedAt
          }
        }
      });
    } catch (error) {
      console.error('Get organization error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async updateOrganization(req: AuthRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        message: 'Update organization not implemented yet'
      });
    } catch (error) {
      console.error('Update organization error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getMembers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      const { organizationId } = req.params;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Check if user is member of the organization
      const membership = await OrganizationMember.findOne({
        organizationId,
        userId: user._id,
        status: 'active'
      });

      if (!membership) {
        res.status(403).json({
          success: false,
          message: 'Access denied: Not a member of this organization'
        });
        return;
      }

      // Get all members
      const members = await OrganizationMember.find({
        organizationId,
        status: 'active'
      }).populate('userId', 'firstName lastName email');

      const memberData = members.map(member => {
        const user = member.userId as any;
        return {
          id: member._id,
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          },
          role: member.role,
          status: member.status,
          joinedAt: member.joinedAt,
          createdAt: member.createdAt
        };
      });

      res.json({
        success: true,
        data: {
          members: memberData
        }
      });
    } catch (error) {
      console.error('Get members error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async inviteMember(req: AuthRequest, res: Response): Promise<void> {
    try {
      res.status(501).json({
        success: false,
        message: 'Invite member not implemented yet'
      });
    } catch (error) {
      console.error('Invite member error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
