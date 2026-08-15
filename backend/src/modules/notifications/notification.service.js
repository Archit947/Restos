'use strict';

const { query, queryOne } = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * Create a notification for a super admin.
 */
async function createNotification({ recipientId, type, title, message, data }) {
  try {
    await query(
      `INSERT INTO notifications (recipient_id, recipient_type, type, title, message, data)
       VALUES (?, 'super_admin', ?, ?, ?, ?)`,
      [recipientId, type, title, message, data ? JSON.stringify(data) : null]
    );
  } catch (err) {
    logger.error('Failed to create notification:', err.message);
  }
}

/**
 * List notifications for a super admin.
 */
async function listNotifications(adminId, { page = 1, limit = 20, unread_only = false }) {
  const offset = (page - 1) * limit;
  let where = 'WHERE recipient_id = ? AND recipient_type = "super_admin"';
  const params = [adminId];

  if (unread_only === 'true' || unread_only === true) {
    where += ' AND is_read = 0';
  }

  const [total] = await query(`SELECT COUNT(*) AS cnt FROM notifications ${where}`, params);
  const [rows] = await query(
    `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );

  return { notifications: rows, total: total[0]?.cnt || 0, page, limit };
}

/**
 * Mark notifications as read.
 */
async function markAsRead(adminId, notificationIds) {
  if (notificationIds?.length) {
    const placeholders = notificationIds.map(() => '?').join(',');
    await query(
      `UPDATE notifications SET is_read = 1, read_at = NOW() WHERE recipient_id = ? AND id IN (${placeholders})`,
      [adminId, ...notificationIds]
    );
  } else {
    await query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE recipient_id = ?',
      [adminId]
    );
  }
}

/**
 * Get unread notification count.
 */
async function getUnreadCount(adminId) {
  const [rows] = await query(
    'SELECT COUNT(*) AS cnt FROM notifications WHERE recipient_id = ? AND is_read = 0',
    [adminId]
  );
  return rows[0]?.cnt || 0;
}

/**
 * Delete old notifications (older than 90 days).
 */
async function cleanupOldNotifications() {
  await query(
    'DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY) AND is_read = 1'
  );
}

module.exports = { createNotification, listNotifications, markAsRead, getUnreadCount, cleanupOldNotifications };
