'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./restaurant.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdmin } = require('../../middleware/rbac.middleware');
const { queryOne } = require('../../config/database');
const { success, notFound, serverError } = require('../../utils/apiResponse');
const multer = require('multer');
const { createStorage } = require('../../middleware/upload.middleware');

// Multi-field upload for create/update (logo + cover)
const restaurantUpload = multer({
  storage: createStorage('restaurants'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP images allowed.'), false);
  },
}).fields([
  { name: 'logo', maxCount: 1 },
  { name: 'cover_image', maxCount: 1 },
]);

// Apply authentication to all routes
router.use(authenticate);

// List & Search
router.get('/', controller.list);
router.get('/check-subdomain', controller.checkSubdomain);

// Get by ID
router.get('/:id', controller.getById);

// Create (requires admin+)
router.post('/', requireAdmin, restaurantUpload, controller.create);

// Update
router.put('/:id', requireAdmin, restaurantUpload, controller.update);

// Status
router.patch('/:id/status', requireAdmin, controller.updateStatus);

// Delete
router.delete('/:id', requireAdmin, controller.remove);

// Password Reset
router.post('/:id/reset-password', requireAdmin, controller.resetPassword);

// Plan Change
router.patch('/:id/plan', requireAdmin, controller.changePlan);

// Bulk Actions
router.post('/bulk', requireAdmin, controller.bulkAction);

// Store credentials linked to this restaurant
router.get('/:id/store-credentials', async (req, res) => {
  try {
    const sc = await queryOne(
      `SELECT id AS store_user_id, username, temp_password, is_active,
              is_first_login, last_login_at, login_attempts, created_at
       FROM store_credentials WHERE restaurant_id = ?`,
      [req.params.id]
    );
    if (!sc) return notFound(res, 'No store account linked to this restaurant.');
    return success(res, sc);
  } catch (err) { return serverError(res, err.message); }
});

module.exports = router;
