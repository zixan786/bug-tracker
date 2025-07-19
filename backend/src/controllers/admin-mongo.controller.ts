import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth-mongo.middleware';
import { User } from '../models/mongoose/User';
import { Organization } from '../models/mongoose/Organization';
import { OrganizationMember } from '../models/mongoose/OrganizationMember';
import { Project } from '../models/mongoose/Project';
import { Bug } from '../models/mongoose/Bug';

export class AdminController {
  static async getAllOrganizations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      
      // Check if user is system admin
      if (!user || user.role !== 'admin' || user.email !== 'admin@bugtracker.com') {
        res.status(403).json({
          success: false,
          message: 'Super admin access required'
        });
        return;
      }

      // Get all organizations with stats
      const organizations = await Organization.find({}).populate('ownerId', 'firstName lastName email');
      
      const organizationsWithStats = await Promise.all(
        organizations.map(async (org) => {
          const [memberCount, projectCount, bugCount] = await Promise.all([
            OrganizationMember.countDocuments({ organizationId: org._id, status: 'active' }),
            Project.countDocuments({ organizationId: org._id }),
            Bug.countDocuments({ organizationId: org._id })
          ]);

          return {
            id: org._id,
            name: org.name,
            slug: org.slug,
            domain: org.domain,
            subscriptionStatus: org.subscriptionStatus,
            trialEndsAt: org.trialEndsAt,
            owner: org.ownerId,
            userCount: memberCount,
            projectCount,
            bugCount,
            createdAt: org.createdAt,
            updatedAt: org.updatedAt
          };
        })
      );

      res.json({
        success: true,
        data: {
          organizations: organizationsWithStats
        }
      });
    } catch (error) {
      console.error('Get organizations error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getSystemStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      
      // Check if user is system admin
      if (!user || user.role !== 'admin' || user.email !== 'admin@bugtracker.com') {
        res.status(403).json({
          success: false,
          message: 'Super admin access required'
        });
        return;
      }

      // Get system-wide statistics
      const [
        totalOrganizations,
        totalUsers,
        totalProjects,
        totalBugs,
        activeSubscriptions,
        trialSubscriptions
      ] = await Promise.all([
        Organization.countDocuments({}),
        User.countDocuments({}),
        Project.countDocuments({}),
        Bug.countDocuments({}),
        Organization.countDocuments({ subscriptionStatus: 'active' }),
        Organization.countDocuments({ subscriptionStatus: 'trial' })
      ]);

      // Calculate estimated monthly revenue (simplified)
      const monthlyRevenue = activeSubscriptions * 99 + trialSubscriptions * 0; // Assuming $99/month for active

      res.json({
        success: true,
        data: {
          totalOrganizations,
          totalUsers,
          totalProjects,
          totalBugs,
          activeSubscriptions,
          trialSubscriptions,
          monthlyRevenue
        }
      });
    } catch (error) {
      console.error('Get system stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async createOrganization(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      
      // Check if user is system admin
      if (!user || user.role !== 'admin' || user.email !== 'admin@bugtracker.com') {
        res.status(403).json({
          success: false,
          message: 'Super admin access required'
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

  static async deleteOrganization(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      
      // Check if user is system admin
      if (!user || user.role !== 'admin' || user.email !== 'admin@bugtracker.com') {
        res.status(403).json({
          success: false,
          message: 'Super admin access required'
        });
        return;
      }

      const { organizationId } = req.params;

      // Find organization
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
        return;
      }

      // Delete related data
      await Promise.all([
        OrganizationMember.deleteMany({ organizationId }),
        Project.deleteMany({ organizationId }),
        Bug.deleteMany({ organizationId }),
        Organization.findByIdAndDelete(organizationId)
      ]);

      res.json({
        success: true,
        message: 'Organization deleted successfully'
      });
    } catch (error) {
      console.error('Delete organization error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getOrganizationDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      
      // Check if user is system admin
      if (!user || user.role !== 'admin' || user.email !== 'admin@bugtracker.com') {
        res.status(403).json({
          success: false,
          message: 'Super admin access required'
        });
        return;
      }

      const { organizationId } = req.params;

      // Get organization with detailed stats
      const organization = await Organization.findById(organizationId).populate('ownerId', 'firstName lastName email');
      if (!organization) {
        res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
        return;
      }

      // Get detailed stats
      const [members, projects, bugs] = await Promise.all([
        OrganizationMember.find({ organizationId }).populate('userId', 'firstName lastName email'),
        Project.find({ organizationId }).populate('ownerId', 'firstName lastName'),
        Bug.find({ organizationId }).populate('reporterId assigneeId', 'firstName lastName')
      ]);

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
            createdAt: organization.createdAt,
            updatedAt: organization.updatedAt
          },
          members,
          projects,
          bugs,
          stats: {
            memberCount: members.length,
            projectCount: projects.length,
            bugCount: bugs.length
          }
        }
      });
    } catch (error) {
      console.error('Get organization details error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
