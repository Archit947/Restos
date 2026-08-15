import { Router } from 'express';
import { getWebsiteConfig, getPublicMenu } from './public.controller';

const router = Router();

router.get('/:tenantId/website', getWebsiteConfig);
router.get('/:tenantId/menu', getPublicMenu);

export { router as publicRoutes };
