import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getDashboardStats, getDashboardCharts, getDashboardActivity } from './dashboard.controller';

const router = Router();
router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/charts', getDashboardCharts);
router.get('/activity', getDashboardActivity);

export default router;
