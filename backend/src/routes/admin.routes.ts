import { Router } from 'express';
import { AdminController } from '../controllers/admin-mongo.controller';
import { authenticateToken, requireSuperAdmin } from '../middlewares/auth-mongo.middleware';

const router = Router();

// All admin routes require super admin authentication
router.use(authenticateToken);
router.use(requireSuperAdmin);

// System admin routes
router.get('/organizations', AdminController.getAllOrganizations);
router.post('/organizations', AdminController.createOrganization);
router.get('/organizations/:organizationId', AdminController.getOrganizationDetails);
router.delete('/organizations/:organizationId', AdminController.deleteOrganization);
router.get('/stats', AdminController.getSystemStats);

export default router;
