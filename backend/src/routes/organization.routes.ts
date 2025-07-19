import { Router } from 'express';
import { OrganizationController } from '../controllers/organization-mongo.controller';
import { authenticateToken } from '../middlewares/auth-mongo.middleware';

const router = Router();

// Protected routes (authentication required)
router.use(authenticateToken);

// Organization management routes
router.post('/', OrganizationController.create);
router.get('/user', OrganizationController.getUserOrganizations);
router.get('/my', OrganizationController.getUserOrganizations); // Alias for frontend compatibility

// Organization-specific routes
router.get('/:organizationId', OrganizationController.getOrganization);
router.put('/:organizationId', OrganizationController.updateOrganization);
router.get('/:organizationId/members', OrganizationController.getMembers);
router.post('/:organizationId/members', OrganizationController.inviteMember);

export default router;
