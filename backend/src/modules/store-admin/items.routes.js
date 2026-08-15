'use strict';

const express = require('express');
const router  = express.Router();
const multer  = require('multer');

const { query, queryOne }    = require('../../config/database');
const { createStorage }      = require('../../middleware/upload.middleware');
const { authenticateStore }  = require('../../middleware/storeAuth.middleware');
const { success, badRequest, notFound, serverError } = require('../../utils/apiResponse');

// All routes require store auth
router.use(authenticateStore);

// ── Multer for item images ────────────────────────────────────────────────────
const itemUpload = multer({
  storage: createStorage('store'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP images are allowed.'), false);
  },
}).single('image');

function withUpload(req, res, next) {
  itemUpload(req, res, (err) => {
    if (err) return badRequest(res, err.message || 'Image upload failed.');
    next();
  });
}

function imageUrlFromFilename(filename) {
  if (!filename) return null;
  if (filename.startsWith('/') || filename.startsWith('http')) return filename;
  return `/uploads/store/${filename}`;
}

// ════════════════════════════════════════════════════════════════
// CATEGORIES
// ════════════════════════════════════════════════════════════════

// GET /items/categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await query(
      'SELECT * FROM store_categories WHERE restaurant_id = ? ORDER BY sort_order, id',
      [req.restaurant.id]
    );
    return success(res, rows);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// POST /items/categories
router.post('/categories', async (req, res) => {
  try {
    const { name, description, sort_order = 0 } = req.body;
    if (!name?.trim()) return badRequest(res, 'Category name is required.');

    const [result] = await query(
      'INSERT INTO store_categories (restaurant_id, tenant_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?) RETURNING id',
      [req.restaurant.id, req.restaurant.tenant_id, name.trim(), description || null, sort_order]
    );
    const cat = await queryOne('SELECT * FROM store_categories WHERE id = ?', [result.insertId]);
    return success(res, cat, 'Category created.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// PATCH /items/categories/:id
router.patch('/categories/:id', async (req, res) => {
  try {
    const { name, description, sort_order, is_active } = req.body;
    const cat = await queryOne(
      'SELECT id FROM store_categories WHERE id = ? AND restaurant_id = ?',
      [req.params.id, req.restaurant.id]
    );
    if (!cat) return notFound(res, 'Category not found.');

    await query(
      `UPDATE store_categories SET
        name        = COALESCE(?, name),
        description = COALESCE(?, description),
        sort_order  = COALESCE(?, sort_order),
        is_active   = COALESCE(?, is_active)
       WHERE id = ?`,
      [name || null, description ?? null, sort_order ?? null, is_active ?? null, req.params.id]
    );
    const updated = await queryOne('SELECT * FROM store_categories WHERE id = ?', [req.params.id]);
    return success(res, updated, 'Category updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// DELETE /items/categories/:id
router.delete('/categories/:id', async (req, res) => {
  try {
    const cat = await queryOne(
      'SELECT id FROM store_categories WHERE id = ? AND restaurant_id = ?',
      [req.params.id, req.restaurant.id]
    );
    if (!cat) return notFound(res, 'Category not found.');
    await query('DELETE FROM store_categories WHERE id = ?', [req.params.id]);
    return success(res, null, 'Category deleted.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ════════════════════════════════════════════════════════════════
// ITEMS
// ════════════════════════════════════════════════════════════════

// GET /items
router.get('/', async (req, res) => {
  try {
    const { category_id, search } = req.query;
    let sql = `
      SELECT i.*, c.name AS category_name
      FROM store_items i
      LEFT JOIN store_categories c ON i.category_id = c.id
      WHERE i.restaurant_id = ?`;
    const params = [req.restaurant.id];

    if (category_id) { sql += ' AND i.category_id = ?'; params.push(category_id); }
    if (search)       { sql += ' AND i.name LIKE ?';     params.push(`%${search}%`); }
    sql += ' ORDER BY i.sort_order, i.id';

    const [rows] = await query(sql, params);
    const items = rows.map(r => ({ ...r, image: imageUrlFromFilename(r.image) }));
    return success(res, items);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// POST /items
router.post('/', withUpload, async (req, res) => {
  try {
    const { name, description, price, currency = 'INR', category_id, stock_quantity = 0, is_available = 1, is_featured = 0, sort_order = 0 } = req.body;
    if (!name?.trim()) return badRequest(res, 'Item name is required.');
    if (!price || isNaN(Number(price))) return badRequest(res, 'Valid price is required.');

    const imageFilename = req.file?.filename || null;

    const [result] = await query(
      `INSERT INTO store_items
       (restaurant_id, tenant_id, category_id, name, description, price, currency, image, stock_quantity, is_available, is_featured, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [
        req.restaurant.id, req.restaurant.tenant_id,
        category_id || null, name.trim(), description || null,
        Number(price), currency, imageFilename,
        Number(stock_quantity),
        Number(is_available), Number(is_featured), Number(sort_order),
      ]
    );
    const item = await queryOne('SELECT * FROM store_items WHERE id = ?', [result.insertId]);
    item.image = imageUrlFromFilename(item.image);
    return success(res, item, 'Item created.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// PATCH /items/:id
router.patch('/:id', withUpload, async (req, res) => {
  try {
    const item = await queryOne(
      'SELECT * FROM store_items WHERE id = ? AND restaurant_id = ?',
      [req.params.id, req.restaurant.id]
    );
    if (!item) return notFound(res, 'Item not found.');

    const { name, description, price, currency, category_id, stock_quantity, is_available, is_featured, sort_order } = req.body;
    const imageFilename = req.file?.filename || undefined;

    await query(
      `UPDATE store_items SET
        name           = COALESCE(?, name),
        description    = COALESCE(?, description),
        price          = COALESCE(?, price),
        currency       = COALESCE(?, currency),
        category_id    = COALESCE(?, category_id),
        stock_quantity = COALESCE(?, stock_quantity),
        is_available   = COALESCE(?, is_available),
        is_featured    = COALESCE(?, is_featured),
        sort_order     = COALESCE(?, sort_order)
        ${imageFilename ? ', image = ?' : ''}
       WHERE id = ?`,
      [
        name || null, description ?? null, price ? Number(price) : null, currency || null,
        category_id ?? null,
        stock_quantity !== undefined ? Number(stock_quantity) : null,
        is_available !== undefined ? Number(is_available) : null,
        is_featured !== undefined ? Number(is_featured) : null,
        sort_order !== undefined ? Number(sort_order) : null,
        ...(imageFilename ? [imageFilename] : []),
        req.params.id,
      ]
    );
    const updated = await queryOne('SELECT * FROM store_items WHERE id = ?', [req.params.id]);
    updated.image = imageUrlFromFilename(updated.image);
    return success(res, updated, 'Item updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// PATCH /items/:id/stock  — quick stock update
router.patch('/:id/stock', async (req, res) => {
  try {
    const { quantity, operation = 'set' } = req.body; // operation: set | add | subtract
    if (quantity === undefined) return badRequest(res, 'quantity is required.');

    const item = await queryOne(
      'SELECT id, stock_quantity FROM store_items WHERE id = ? AND restaurant_id = ?',
      [req.params.id, req.restaurant.id]
    );
    if (!item) return notFound(res, 'Item not found.');

    let newQty;
    if (operation === 'add')      newQty = item.stock_quantity + Number(quantity);
    else if (operation === 'subtract') newQty = Math.max(0, item.stock_quantity - Number(quantity));
    else newQty = Number(quantity);

    await query('UPDATE store_items SET stock_quantity = ? WHERE id = ?', [newQty, req.params.id]);
    return success(res, { stock_quantity: newQty }, 'Stock updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// DELETE /items/:id
router.delete('/:id', async (req, res) => {
  try {
    const item = await queryOne(
      'SELECT id FROM store_items WHERE id = ? AND restaurant_id = ?',
      [req.params.id, req.restaurant.id]
    );
    if (!item) return notFound(res, 'Item not found.');
    await query('DELETE FROM store_items WHERE id = ?', [req.params.id]);
    return success(res, null, 'Item deleted.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

module.exports = router;
