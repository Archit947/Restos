'use strict';

const express = require('express');
const router  = express.Router();
const { query, queryOne } = require('../../config/database');
const { authenticateRestaurant } = require('../../middleware/restaurantAuth.middleware');
const { success, created, notFound, badRequest, serverError } = require('../../utils/apiResponse');

router.use(authenticateRestaurant);

const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

// ── Generate order number ─────────────────────────────────────────────────────
function genOrderNumber() {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${ts}-${rnd}`;
}

// ── GET / — list orders (paginated + filtered) ────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const { status, date, date_from, date_to, order_type, search, source, page = 1, limit = 30 } = req.query;
    const pg  = Math.max(1, parseInt(page));
    const lim = Math.min(parseInt(limit), 200);
    const offset = (pg - 1) * lim;

    let where = 'WHERE restaurant_id = ?';
    const params = [rid];
    if (status)     { where += ' AND status = ?'; params.push(status); }
    if (order_type) { where += ' AND order_type = ?'; params.push(order_type); }
    if (source)     { where += ' AND source = ?'; params.push(source); }
    if (date)       { where += ' AND DATE(created_at) = ?'; params.push(date); }
    if (date_from)  { where += ' AND DATE(created_at) >= ?'; params.push(date_from); }
    if (date_to)    { where += ' AND DATE(created_at) <= ?'; params.push(date_to); }
    if (search) {
      where += ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR table_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await query(
      `SELECT COUNT(*) AS total FROM customer_orders ${where}`, params
    );
    const [orders] = await query(
      `SELECT * FROM customer_orders ${where} ORDER BY created_at DESC LIMIT ${lim} OFFSET ${offset}`,
      params
    );

    const parsed = orders.map(o => ({
      ...o,
      items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
    }));

    return success(res, { orders: parsed, total, page: pg, limit: lim });
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ── POST / — create order (from POS / table portal) ──────────────────────────
router.post('/', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const tid = req.restaurant.tenant_id;
    const {
      items, customer_name = 'Walk-in', customer_phone = '',
      order_type = 'dine_in', table_id, table_number, area_name,
      special_instructions, notes, discount = 0, tax = 0,
      payment_method = 'cash', payment_status = 'pending',
      source = 'pos',
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return badRequest(res, 'At least one item is required.');
    }

    const subtotal = items.reduce((s, i) => s + (Number(i.price) * Number(i.qty || 1)), 0);
    const total    = subtotal + Number(tax) - Number(discount);
    const orderNum = genOrderNumber();

    const [r] = await query(
      `INSERT INTO customer_orders
         (restaurant_id, tenant_id, order_number, customer_name, customer_phone,
          items, subtotal, total, discount, tax, status, order_type,
          table_id, table_number, area_name,
          special_instructions, notes, payment_method, payment_status, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
      [rid, tid, orderNum, customer_name, customer_phone || '',
       JSON.stringify(items), subtotal.toFixed(2), total.toFixed(2),
       Number(discount).toFixed(2), Number(tax).toFixed(2),
       order_type, table_id || null, table_number || null, area_name || null,
       special_instructions || null, notes || null,
       payment_method, payment_status, source]
    );

    // Mark table as occupied if table_id provided
    if (table_id) {
      await query('UPDATE restaurant_tables SET status = ? WHERE id = ?', ['occupied', table_id]);
    }

    const order = await queryOne('SELECT * FROM customer_orders WHERE id = ?', [r.insertId]);
    if (order && typeof order.items === 'string') order.items = JSON.parse(order.items);
    return created(res, order, 'Order created.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ── GET /table/:tableId/active — active order for a table ────────────────────
router.get('/table/:tableId/active', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const order = await queryOne(
      `SELECT * FROM customer_orders
       WHERE restaurant_id = ? AND table_id = ?
         AND status NOT IN ('delivered','cancelled')
       ORDER BY created_at DESC LIMIT 1`,
      [rid, req.params.tableId]
    );
    if (!order) return notFound(res, 'No active order for this table.');
    if (typeof order.items === 'string') order.items = JSON.parse(order.items);
    return success(res, order);
  } catch (err) { return serverError(res, err.message); }
});

// ── PATCH /:id/add-items — append items to an existing order ─────────────────
router.patch('/:id/add-items', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const { items: newItems } = req.body;
    if (!Array.isArray(newItems) || !newItems.length) return badRequest(res, 'Items required.');
    const existing = await queryOne(
      'SELECT * FROM customer_orders WHERE id = ? AND restaurant_id = ?',
      [req.params.id, rid]
    );
    if (!existing) return notFound(res, 'Order not found.');

    // Merge: increment qty if item already exists, else push
    const current = typeof existing.items === 'string' ? JSON.parse(existing.items) : existing.items;
    newItems.forEach(ni => {
      const ex = current.find(i => i.id === ni.id);
      if (ex) ex.qty += Number(ni.qty) || 1;
      else current.push({ ...ni, qty: Number(ni.qty) || 1 });
    });

    const subtotal = current.reduce((s, i) => s + (Number(i.price) * Number(i.qty)), 0);
    const discount = Number(existing.discount) || 0;
    const tax      = Number(existing.tax)      || 0;
    const total    = Math.max(0, subtotal - discount + tax);

    await query(
      'UPDATE customer_orders SET items = ?, subtotal = ?, total = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(current), subtotal.toFixed(2), total.toFixed(2), req.params.id]
    );

    const updated = await queryOne('SELECT * FROM customer_orders WHERE id = ?', [req.params.id]);
    if (typeof updated.items === 'string') updated.items = JSON.parse(updated.items);
    return success(res, updated, 'Items added to order.');
  } catch (err) { return serverError(res, err.message); }
});

// ── GET /:id — single order ───────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const order = await queryOne(
      'SELECT * FROM customer_orders WHERE id = ? AND restaurant_id = ?',
      [req.params.id, req.restaurant.id]
    );
    if (!order) return notFound(res, 'Order not found.');
    if (typeof order.items === 'string') order.items = JSON.parse(order.items);
    return success(res, order);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ── PATCH /:id/status ─────────────────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return badRequest(res, `Invalid status.`);
    }
    const existing = await queryOne(
      'SELECT id, table_id FROM customer_orders WHERE id = ? AND restaurant_id = ?',
      [req.params.id, rid]
    );
    if (!existing) return notFound(res, 'Order not found.');
    await query('UPDATE customer_orders SET status = ? WHERE id = ?', [status, req.params.id]);

    // Free table when delivered
    if (status === 'delivered' && existing.table_id) {
      await query('UPDATE restaurant_tables SET status = ? WHERE id = ?', ['available', existing.table_id]);
    }
    return success(res, null, 'Order status updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ── PATCH /:id/payment — update payment ──────────────────────────────────────
router.patch('/:id/payment', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const { payment_method, payment_status } = req.body;
    const existing = await queryOne(
      'SELECT id FROM customer_orders WHERE id = ? AND restaurant_id = ?', [req.params.id, rid]
    );
    if (!existing) return notFound(res, 'Order not found.');
    await query(
      'UPDATE customer_orders SET payment_method = COALESCE(?, payment_method), payment_status = COALESCE(?, payment_status) WHERE id = ?',
      [payment_method || null, payment_status || null, req.params.id]
    );
    return success(res, null, 'Payment updated.');
  } catch (err) { return serverError(res, err.message); }
});

module.exports = router;
