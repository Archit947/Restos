'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { listNotifications, markAsRead, getUnreadCount } = require('./notification.service');
const { success, paginated, serverError, buildPaginationMeta } = require('../../utils/apiResponse');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { page, limit, unread_only } = req.query;
    const result = await listNotifications(req.user.id, { page, limit, unread_only });
    const meta = buildPaginationMeta(result.page, result.limit, result.total);
    return paginated(res, result.notifications, meta);
  } catch (err) {
    return serverError(res, err.message);
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.id);
    return success(res, { count });
  } catch (err) {
    return serverError(res, err.message);
  }
});

router.post('/mark-read', async (req, res) => {
  try {
    const { ids } = req.body; // Array of IDs or empty for all
    await markAsRead(req.user.id, ids);
    return success(res, null, 'Notifications marked as read.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

module.exports = router;
