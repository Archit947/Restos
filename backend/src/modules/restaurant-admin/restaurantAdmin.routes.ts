import { Router } from 'express';
import { requireRestaurantAuth } from '../../middleware/restaurantAuth';
import { getTemplates, completeSetup } from './restaurantAdmin.controller';
import { getDashboardStats, getDashboardCharts, getDashboardActivity } from './restaurantAdmin.controller';
import { menuRoutes } from './menu.routes';
import { inventoryRoutes } from './inventory.routes';
import { websiteRoutes } from './website.routes';

const router = Router();

// All restaurant admin routes require restaurant authentication
router.use(requireRestaurantAuth);

// Templates (public for restaurants to select during setup)
router.get('/templates', getTemplates);

// Setup
router.post('/setup/complete', completeSetup);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/charts', getDashboardCharts);
router.get('/dashboard/activity', getDashboardActivity);

// Menu Catalog
router.use('/menu', menuRoutes);

// Inventory Master
router.use('/inventory', inventoryRoutes);

// Website CMS
router.use('/website', websiteRoutes);

export { router as restaurantAdminRoutes };
