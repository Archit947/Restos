'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get('/stats', controller.getStats);
router.get('/charts', controller.getCharts);
router.get('/recent-activity', controller.getRecentActivity);
router.get('/expiring-subscriptions', controller.getExpiringSubscriptions);
router.get('/top-restaurants', controller.getTopRestaurants);

module.exports = router;
