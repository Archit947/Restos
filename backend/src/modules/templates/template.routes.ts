import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { 
  getTemplates, 
  setTemplateDefault, 
  toggleTemplateStatus, 
  deleteTemplate 
} from './template.controller';

const router = Router();

// All template routes require authentication and super_admin role
router.use(authenticate, authorize('super_admin'));

router.get('/', getTemplates);
router.patch('/:id/default', setTemplateDefault);
router.patch('/:id/toggle-status', toggleTemplateStatus);
router.delete('/:id', deleteTemplate);

export { router as templateRoutes };
