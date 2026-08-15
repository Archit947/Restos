'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { query } = require('../../config/database');
const { success, paginated, serverError, buildPaginationMeta } = require('../../utils/apiResponse');

router.use(authenticate);

// List audit logs with filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, action, entity_type, user_id, tenant_id, status, from_date, to_date } = req.query;
    const lim = Math.min(parseInt(limit), 100);
    const pg = Math.max(1, parseInt(page));
    const offset = (pg - 1) * lim;

    let where = [];
    const params = [];

    if (search) {
      where.push('(al.description LIKE ? OR al.entity_name LIKE ? OR al.user_email LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (action) { where.push('al.action = ?'); params.push(action); }
    if (entity_type) { where.push('al.entity_type = ?'); params.push(entity_type); }
    if (user_id) { where.push('al.user_id = ?'); params.push(user_id); }
    if (tenant_id) { where.push('al.tenant_id = ?'); params.push(tenant_id); }
    if (status) { where.push('al.status = ?'); params.push(status); }
    if (from_date) { where.push('al.created_at >= ?'); params.push(from_date); }
    if (to_date) { where.push('al.created_at <= ?'); params.push(to_date + ' 23:59:59'); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [countResult] = await query(`SELECT COUNT(*) AS total FROM audit_logs al ${whereClause}`, params);
    const total = countResult[0]?.total || 0;

    const [rows] = await query(
      `SELECT al.*, sa.name AS admin_name
       FROM audit_logs al
       LEFT JOIN super_admins sa ON al.user_id = sa.id AND al.user_type = 'super_admin'
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, lim, offset]
    );

    return paginated(res, rows, buildPaginationMeta(pg, lim, total));
  } catch (err) {
    return serverError(res, err.message);
  }
});

// Get audit log detail
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM audit_logs WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Not found.' });
    return success(res, rows[0]);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// Get distinct actions for filter dropdown
router.get('/meta/actions', async (req, res) => {
  try {
    const [rows] = await query('SELECT DISTINCT action FROM audit_logs ORDER BY action ASC');
    return success(res, rows.map(r => r.action));
  } catch (err) {
    return serverError(res, err.message);
  }
});

module.exports = router;
