import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppDataSource } from '../config/database';
import { Organization, SubscriptionStatus } from '../models/Organization';
import { OrganizationMember, MemberStatus } from '../models/OrganizationMember';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Bug } from '../models/Bug';

export class AdminController {
  /**
   * Get all organizations (Super Admin only)
   */
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

      const organizationRepo = AppDataSource.getRepository(Organization);
      const memberRepo = AppDataSource.getRepository(OrganizationMember);
      const projectRepo = AppDataSource.getRepository(Project);
      const bugRepo = AppDataSource.getRepository(Bug);

      const organizations = await organizationRepo.find({
        order: { createdAt: 'DESC' }
      });

      // Get counts for each organization
      const organizationsWithCounts = await Promise.all(
        organizations.map(async (org) => {
          const userCount = await memberRepo.count({
            where: { organizationId: org.id, status: MemberStatus.ACTIVE }
          });
          
          const projectCount = await projectRepo.count({
            where: { organizationId: org.id }
          });
          
          const bugCount = await bugRepo.count({
            where: { organizationId: org.id }
          });

          return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            domain: org.domain,
            subscriptionStatus: org.subscriptionStatus,
            trialEndsAt: org.trialEndsAt,
            createdAt: org.createdAt,
            userCount,
            projectCount,
            bugCount,
            isActive: org.isActive
          };
        })
      );

      res.json({
        success: true,
        data: { organizations: organizationsWithCounts }
      });
    } catch (error) {
      console.error('Get all organizations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch organizations'
      });
    }
  }

  /**
   * Get system statistics (Super Admin only)
   */
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

      const organizationRepo = AppDataSource.getRepository(Organization);
      const userRepo = AppDataSource.getRepository(User);
      const projectRepo = AppDataSource.getRepository(Project);
      const bugRepo = AppDataSource.getRepository(Bug);

      const [
        totalOrganizations,
        totalUsers,
        totalProjects,
        totalBugs,
        activeOrganizations,
        trialOrganizations
      ] = await Promise.all([
        organizationRepo.count(),
        userRepo.count(),
        projectRepo.count(),
        bugRepo.count(),
        organizationRepo.count({ where: { subscriptionStatus: SubscriptionStatus.ACTIVE } }),
        organizationRepo.count({ where: { subscriptionStatus: SubscriptionStatus.TRIAL } })
      ]);

      res.json({
        success: true,
        data: {
          totalOrganizations,
          totalUsers,
          totalProjects,
          totalBugs,
          activeOrganizations,
          trialOrganizations
        }
      });
    } catch (error) {
      console.error('Get system stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system statistics'
      });
    }
  }

  /**
   * Create organization (Super Admin only)
   */
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

      const organizationRepo = AppDataSource.getRepository(Organization);

      // Check if slug is available
      const existingOrg = await organizationRepo.findOne({ where: { slug } });
      if (existingOrg) {
        res.status(400).json({
          success: false,
          message: 'Organization slug is already taken'
        });
        return;
      }

      // Create organization
      const organization = organizationRepo.create({
        name,
        slug,
        subscriptionStatus: SubscriptionStatus.TRIAL,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
      });

      await organizationRepo.save(organization);

      res.status(201).json({
        success: true,
        data: { organization }
      });
    } catch (error) {
      console.error('Create organization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create organization'
      });
    }
  }

  /**
   * Delete organization (Super Admin only)
   */
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
      const organizationRepo = AppDataSource.getRepository(Organization);

      const organization = await organizationRepo.findOne({
        where: { id: parseInt(organizationId) }
      });

      if (!organization) {
        res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
        return;
      }

      await organizationRepo.remove(organization);

      res.json({
        success: true,
        message: 'Organization deleted successfully'
      });
    } catch (error) {
      console.error('Delete organization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete organization'
      });
    }
  }

  /**
   * Get organization details with full data (Super Admin only)
   */
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
      const organizationRepo = AppDataSource.getRepository(Organization);
      const memberRepo = AppDataSource.getRepository(OrganizationMember);
      const projectRepo = AppDataSource.getRepository(Project);
      const bugRepo = AppDataSource.getRepository(Bug);

      const organization = await organizationRepo.findOne({
        where: { id: parseInt(organizationId) }
      });

      if (!organization) {
        res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
        return;
      }

      // Get members with user details
      const members = await memberRepo.find({
        where: { organizationId: organization.id },
        relations: ['user'],
        order: { joinedAt: 'DESC' }
      });

      // Get projects
      const projects = await projectRepo.find({
        where: { organizationId: organization.id },
        relations: ['owner'],
        order: { createdAt: 'DESC' }
      });

      // Get bugs
      const bugs = await bugRepo.find({
        where: { organizationId: organization.id },
        relations: ['reporter', 'assignee', 'project'],
        order: { createdAt: 'DESC' }
      });

      res.json({
        success: true,
        data: {
          organization,
          members: members.map(member => ({
            id: member.id,
            role: member.role,
            status: member.status,
            joinedAt: member.joinedAt,
            user: {
              id: member.user.id,
              firstName: member.user.firstName,
              lastName: member.user.lastName,
              email: member.user.email
            }
          })),
          projects: projects.map(project => ({
            id: project.id,
            name: project.name,
            description: project.description,
            status: project.status,
            createdAt: project.createdAt,
            owner: {
              id: project.owner.id,
              firstName: project.owner.firstName,
              lastName: project.owner.lastName
            }
          })),
          bugs: bugs.map(bug => ({
            id: bug.id,
            title: bug.title,
            description: bug.description,
            status: bug.status,
            priority: bug.priority,
            severity: bug.severity,
            type: bug.type,
            createdAt: bug.createdAt,
            reporter: bug.reporter ? {
              id: bug.reporter.id,
              firstName: bug.reporter.firstName,
              lastName: bug.reporter.lastName
            } : null,
            assignee: bug.assignee ? {
              id: bug.assignee.id,
              firstName: bug.assignee.firstName,
              lastName: bug.assignee.lastName
            } : null,
            project: {
              id: bug.project.id,
              name: bug.project.name
            }
          }))
        }
      });
    } catch (error) {
      console.error('Get organization details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch organization details'
      });
    }
  }
}
