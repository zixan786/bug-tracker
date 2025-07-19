import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppDataSource } from '../config/database';
import { Organization, SubscriptionStatus as OrgSubscriptionStatus } from '../models/Organization';
import { OrganizationMember, OrganizationRole, MemberStatus } from '../models/OrganizationMember';
import { User } from '../models/User';
import { Plan } from '../models/Plan';

export class OrganizationController {
  /**
   * Create a new organization (during signup)
   */
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, slug } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const organizationRepo = AppDataSource.getRepository(Organization);
      const memberRepo = AppDataSource.getRepository(OrganizationMember);
      const planRepo = AppDataSource.getRepository(Plan);

      // Check if slug is available
      const existingOrg = await organizationRepo.findOne({ where: { slug } });
      if (existingOrg) {
        res.status(400).json({
          success: false,
          message: 'Organization slug is already taken'
        });
        return;
      }

      // Get starter plan
      const starterPlan = await planRepo.findOne({ where: { slug: 'starter' } });
      if (!starterPlan) {
        res.status(500).json({
          success: false,
          message: 'Default plan not found'
        });
        return;
      }

      // Create organization
      const organization = organizationRepo.create({
        name,
        slug,
        subscriptionStatus: OrgSubscriptionStatus.TRIAL,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
      });

      await organizationRepo.save(organization);

      // Add user as owner
      const member = memberRepo.create({
        organizationId: organization.id,
        userId,
        role: OrganizationRole.OWNER,
        status: MemberStatus.ACTIVE
      });

      await memberRepo.save(member);

      // Trial subscription is handled by organization.subscriptionStatus

      res.status(201).json({
        success: true,
        data: {
          organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            subscriptionStatus: organization.subscriptionStatus,
            trialEndsAt: organization.trialEndsAt
          },
          member: {
            role: member.role,
            status: member.status
          }
        }
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
   * Get user's organizations
   */
  static async getUserOrganizations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const memberRepo = AppDataSource.getRepository(OrganizationMember);
      const members = await memberRepo.find({
        where: { userId, status: MemberStatus.ACTIVE },
        relations: ['organization', 'organization.subscriptions', 'organization.subscriptions.plan']
      });

      const organizations = members.map(member => ({
        id: member.organization.id,
        name: member.organization.name,
        slug: member.organization.slug,
        role: member.role,
        subscriptionStatus: member.organization.subscriptionStatus,
        isActive: member.organization.isActive,
        trialEndsAt: member.organization.trialEndsAt,
        plan: member.organization.subscriptions?.[0]?.plan
      }));

      res.json({
        success: true,
        data: { organizations }
      });
    } catch (error) {
      console.error('Get user organizations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch organizations'
      });
    }
  }

  /**
   * Get organization details
   */
  static async getOrganization(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organization = req.tenant?.organization;
      const member = req.tenant?.member;

      if (!organization || !member) {
        res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
        return;
      }

      // Get member count
      const memberRepo = AppDataSource.getRepository(OrganizationMember);
      const memberCount = await memberRepo.count({
        where: { organizationId: organization.id, status: MemberStatus.ACTIVE }
      });

      res.json({
        success: true,
        data: {
          organization: {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            domain: organization.domain,
            logoUrl: organization.logoUrl,
            settings: organization.settings,
            subscriptionStatus: organization.subscriptionStatus,
            trialEndsAt: organization.trialEndsAt,
            memberCount,
            createdAt: organization.createdAt
          },
          member: {
            role: member.role,
            joinedAt: member.joinedAt,
            permissions: member.permissions
          }
        }
      });
    } catch (error) {
      console.error('Get organization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch organization'
      });
    }
  }

  /**
   * Update organization
   */
  static async updateOrganization(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, domain, logoUrl, settings } = req.body;
      const organization = req.tenant?.organization;
      const member = req.tenant?.member;

      if (!organization || !member?.isAdmin()) {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const organizationRepo = AppDataSource.getRepository(Organization);
      
      if (name) organization.name = name;
      if (domain !== undefined) organization.domain = domain;
      if (logoUrl !== undefined) organization.logoUrl = logoUrl;
      if (settings) organization.settings = { ...organization.settings, ...settings };

      await organizationRepo.save(organization);

      res.json({
        success: true,
        data: { organization }
      });
    } catch (error) {
      console.error('Update organization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update organization'
      });
    }
  }

  /**
   * Get organization members
   */
  static async getMembers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const organization = req.tenant?.organization;
      const currentMember = req.tenant?.member;

      if (!organization || !currentMember) {
        res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
        return;
      }

      const memberRepo = AppDataSource.getRepository(OrganizationMember);
      const members = await memberRepo.find({
        where: { organizationId: organization.id },
        relations: ['user'],
        order: { joinedAt: 'DESC' }
      });

      const membersData = members.map(member => ({
        id: member.id,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
        invitedAt: member.invitedAt,
        user: {
          id: member.user.id,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          email: member.user.email
        }
      }));

      res.json({
        success: true,
        data: { members: membersData }
      });
    } catch (error) {
      console.error('Get members error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch members'
      });
    }
  }

  /**
   * Invite user to organization
   */
  static async inviteMember(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, role = OrganizationRole.MEMBER } = req.body;
      const organization = req.tenant?.organization;
      const inviter = req.tenant?.member;

      if (!organization || !inviter?.canManageMembers()) {
        res.status(403).json({
          success: false,
          message: 'Permission denied'
        });
        return;
      }

      const userRepo = AppDataSource.getRepository(User);
      const memberRepo = AppDataSource.getRepository(OrganizationMember);

      // Find user by email
      const user = await userRepo.findOne({ where: { email } });
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Check if already a member
      const existingMember = await memberRepo.findOne({
        where: { organizationId: organization.id, userId: user.id }
      });

      if (existingMember) {
        res.status(400).json({
          success: false,
          message: 'User is already a member'
        });
        return;
      }

      // Create member
      const member = memberRepo.create({
        organizationId: organization.id,
        userId: user.id,
        role,
        invitedBy: inviter.userId,
        invitedAt: new Date(),
        status: MemberStatus.ACTIVE // In real app, this would be PENDING until accepted
      });

      await memberRepo.save(member);

      // TODO: Send invitation email

      res.status(201).json({
        success: true,
        data: { member }
      });
    } catch (error) {
      console.error('Invite member error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to invite member'
      });
    }
  }
}
