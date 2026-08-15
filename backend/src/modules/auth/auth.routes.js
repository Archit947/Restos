'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authLimiter } = require('../../middleware/rateLimiter.middleware');

// Public routes
router.post('/login', authLimiter, controller.login);
router.post('/refresh-token', controller.refreshToken);
router.post('/forgot-password', authLimiter, controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

// Protected routes
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.getProfile);
router.put('/me', authenticate, controller.updateProfile);
router.put('/change-password', authenticate, controller.changePassword);

module.exports = router;
