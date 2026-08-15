import { Router } from 'express';
import { body, query } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  listRestaurants, getRestaurant, createRestaurant, updateRestaurant,
  suspendRestaurant, activateRestaurant, deleteRestaurant,
  resetRestaurantPassword, changePlan, bulkAction, checkSubdomain,
} from './restaurant.controller';
import { config } from '../../config';

const router = Router();

// ── File upload config ───────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, _file, cb) => cb(null, config.storage.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.storage.maxFileSize },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

router.get('/', listRestaurants);
router.get('/subdomain/check', checkSubdomain);
router.get('/:id', getRestaurant);

router.post(
  '/',
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'cover', maxCount: 1 }]),
  [
    body('restaurant_name').trim().notEmpty().withMessage('Restaurant name required'),
    body('business_name').trim().notEmpty().withMessage('Business name required'),
    body('owner_name').trim().notEmpty().withMessage('Owner name required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('phone').trim().notEmpty().withMessage('Phone number required'),
    body('plan').optional().isIn(['starter', 'professional', 'enterprise']),
  ],
  validate,
  createRestaurant
);

router.put('/:id', updateRestaurant);
router.delete('/:id', deleteRestaurant);
router.post('/:id/suspend', suspendRestaurant);
router.post('/:id/activate', activateRestaurant);
router.post('/:id/reset-password', resetRestaurantPassword);
router.post('/:id/change-plan', [
  body('plan').isIn(['starter', 'professional', 'enterprise']).withMessage('Invalid plan'),
], validate, changePlan);
router.post('/bulk', [
  body('action').isIn(['activate', 'suspend', 'delete']).withMessage('Invalid action'),
  body('ids').isArray({ min: 1 }).withMessage('At least one ID required'),
], validate, bulkAction);

export default router;
