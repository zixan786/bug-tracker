import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { OrganizationMember, MemberStatus } from '../models/OrganizationMember';
import { User } from '../models/User';

// Extend Request interface to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        organization: Organization;
        member: OrganizationMember;
        user: User;
      };
    }
  }
}

export class TenantMiddleware {
  /**
   * Extract tenant from subdomain (e.g., acme.bugtracker.com)
   */
  static async fromSubdomain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const host = req.get('host') || '';
      const subdomain = host.split('.')[0];
      
      // Skip for localhost and main domain
      if (subdomain === 'localhost' || subdomain === 'www' || !subdomain) {
        return next();
      }

      const organizationRepo = AppDataSource.getRepository(Organization);
      const organization = await organizationRepo.findOne({
        where: { slug: subdomain },
        relations: ['subscriptions', 'subscriptions.plan']
      });

      if (!organization) {
        res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
        return;
      }

      // Check if organization is active
      if (!organization.isActive) {
        res.status(403).json({
          success: false,
          message: 'Organization subscription is not active'
        });
        return;
      }

      req.tenant = { ...req.tenant, organization } as any;
      next();
    } catch (error) {
      console.error('Tenant middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Extract tenant from organization header or parameter
   */
  static async fromHeader(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.headers['x-organization-id'] || req.params.organizationId || req.body.organizationId;
      
      if (!orgId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      const organizationRepo = AppDataSource.getRepository(Organization);
      const organization = await organizationRepo.findOne({
        where: { id: parseInt(orgId as string) },
        relations: ['subscriptions', 'subscriptions.plan']
      });

      if (!organization) {
        res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
        return;
      }

      if (!organization.isActive) {
        res.status(403).json({
          success: false,
          message: 'Organization subscription is not active'
        });
        return;
      }

      req.tenant = { ...req.tenant, organization } as any;
      next();
    } catch (error) {
      console.error('Tenant middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Verify user belongs to the tenant organization
   */
  static async verifyMembership(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.tenant?.organization) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const memberRepo = AppDataSource.getRepository(OrganizationMember);
      const member = await memberRepo.findOne({
        where: {
          organizationId: req.tenant.organization.id,
          userId: req.user.id,
          status: MemberStatus.ACTIVE
        },
        relations: ['user', 'organization']
      });

      if (!member) {
        res.status(403).json({
          success: false,
          message: 'Access denied: Not a member of this organization'
        });
        return;
      }

      req.tenant.member = member;
      req.tenant.user = req.user;
      next();
    } catch (error) {
      console.error('Membership verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Check if user has required role
   */
  static requireRole(roles: string | string[]) {
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.tenant?.member) {
        res.status(403).json({
          success: false,
          message: 'Access denied: Organization membership required'
        });
        return;
      }

      if (!requiredRoles.includes(req.tenant.member.role)) {
        res.status(403).json({
          success: false,
          message: `Access denied: Required role(s): ${requiredRoles.join(', ')}`
        });
        return;
      }

      next();
    };
  }

  /**
   * Check subscription limits
   */
  static async checkLimits(limitType: string, increment: number = 1) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.tenant?.organization) {
          return res.status(400).json({
            success: false,
            message: 'Organization context required'
          });
        }

        const organization = req.tenant.organization;
        const subscription = organization.subscriptions?.[0];
        
        if (!subscription?.plan) {
          return res.status(403).json({
            success: false,
            message: 'No active subscription plan'
          });
        }

        const plan = subscription.plan;
        const limit = plan.getLimit(limitType);

        if (limit === Infinity) {
          return next(); // Unlimited
        }

        // Get current usage (implement based on your needs)
        const currentUsage = await getCurrentUsage(organization.id, limitType);
        
        if (currentUsage + increment > limit) {
          return res.status(403).json({
            success: false,
            message: `Subscription limit exceeded for ${limitType}. Current: ${currentUsage}, Limit: ${limit}`,
            code: 'LIMIT_EXCEEDED',
            limit: {
              type: limitType,
              current: currentUsage,
              max: limit,
              planName: plan.name
            }
          });
        }

        next();
      } catch (error) {
        console.error('Limit check error:', error);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    };
  }
}

// Helper function to get current usage
async function getCurrentUsage(organizationId: number, limitType: string): Promise<number> {
  // const organizationRepo = AppDataSource.getRepository(Organization);
  
  switch (limitType) {
    case 'maxUsers':
      const memberRepo = AppDataSource.getRepository(OrganizationMember);
      return await memberRepo.count({
        where: { organizationId, status: MemberStatus.ACTIVE }
      });
    
    case 'maxProjects':
      // Implement project count
      return 0;
    
    case 'maxBugs':
      // Implement bug count
      return 0;
    
    default:
      return 0;
  }
}
