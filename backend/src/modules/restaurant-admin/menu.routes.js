'use strict';

const express = require('express');
const router  = express.Router();

const { query, queryOne } = require('../../config/database');
const { authenticateRestaurant } = require('../../middleware/restaurantAuth.middleware');
const { success, created, badRequest, notFound, serverError } = require('../../utils/apiResponse');
const multer = require('multer');
const { createStorage } = require('../../middleware/upload.middleware');
const config = require('../../config/env');

router.use(authenticateRestaurant);

// ═══════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════

// Use Supabase storage engine — files go to the 'menu' folder in the bucket
const upload = multer({
  storage: createStorage('menu'),
  limits: { fileSize: (config.UPLOAD.MAX_FILE_SIZE_MB || 5) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// GET /categories
router.get('/categories', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const [cats] = await query(
      `SELECT c.*, COUNT(i.id) AS item_count
       FROM menu_categories c
       LEFT JOIN menu_items i ON i.category_id = c.id AND i.restaurant_id = c.restaurant_id
       WHERE c.restaurant_id = ?
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.name ASC`,
      [rid]
    );
    return success(res, cats);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// POST /categories
router.post('/categories', async (req, res) => {
  try {
    const { name, description, sort_order = 0 } = req.body;
    if (!name?.trim()) return badRequest(res, 'Category name is required.');

    const rid = req.restaurant.id;
    const tid = req.restaurant.tenant_id;

    const [result] = await query(
      `INSERT INTO menu_categories (restaurant_id, tenant_id, name, description, sort_order)
       VALUES (?, ?, ?, ?, ?) RETURNING id`,
      [rid, tid, name.trim(), description || null, sort_order]
    );
    const cat = await queryOne('SELECT * FROM menu_categories WHERE id = ?', [result.insertId]);
    return created(res, cat, 'Category created.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// PUT /categories/:id
router.put('/categories/:id', async (req, res) => {
  try {
    const { name, description, sort_order, is_active } = req.body;
    const rid = req.restaurant.id;
    const existing = await queryOne(
      'SELECT id FROM menu_categories WHERE id = ? AND restaurant_id = ?',
      [req.params.id, rid]
    );
    if (!existing) return notFound(res, 'Category not found.');

    await query(
      `UPDATE menu_categories
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           sort_order = COALESCE(?, sort_order),
           is_active = COALESCE(?, is_active)
       WHERE id = ? AND restaurant_id = ?`,
      [name || null, description !== undefined ? description : null, sort_order ?? null,
       is_active !== undefined ? (is_active ? 1 : 0) : null, req.params.id, rid]
    );
    const cat = await queryOne('SELECT * FROM menu_categories WHERE id = ?', [req.params.id]);
    return success(res, cat, 'Category updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// DELETE /categories/:id
router.delete('/categories/:id', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const existing = await queryOne(
      'SELECT id FROM menu_categories WHERE id = ? AND restaurant_id = ?',
      [req.params.id, rid]
    );
    if (!existing) return notFound(res, 'Category not found.');

    // Unlink items before deleting category
    await query('UPDATE menu_items SET category_id = NULL WHERE category_id = ? AND restaurant_id = ?', [req.params.id, rid]);
    await query('DELETE FROM menu_categories WHERE id = ? AND restaurant_id = ?', [req.params.id, rid]);
    return success(res, null, 'Category deleted.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// ═══════════════════════════════════════════════════════════════
// ITEMS
// ═══════════════════════════════════════════════════════════════

// GET /items  ?category_id=&available=
router.get('/items', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const { category_id, available } = req.query;

    let sql = `
      SELECT i.*, c.name AS category_name
      FROM menu_items i
      LEFT JOIN menu_categories c ON i.category_id = c.id
      WHERE i.restaurant_id = ?`;
    const params = [rid];

    if (category_id) { sql += ' AND i.category_id = ?'; params.push(category_id); }
    if (available !== undefined) { sql += ' AND i.is_available = ?'; params.push(available === 'true' ? 1 : 0); }
    sql += ' ORDER BY c.sort_order ASC, i.sort_order ASC, i.name ASC';

    const [items] = await query(sql, params);
    return success(res, items);
  } catch (err) {
    return serverError(res, err.message);
  }
});

// GET /items/by-number/:num — lookup by item_number (for POS)
router.get('/items/by-number/:num', async (req, res) => {
  try {
    const item = await queryOne(
      `SELECT i.*, c.name AS category_name
       FROM menu_items i LEFT JOIN menu_categories c ON i.category_id = c.id
       WHERE i.restaurant_id = ? AND i.item_number = ? AND i.is_available = 1`,
      [req.restaurant.id, parseInt(req.params.num) || 0]
    );
    if (!item) return notFound(res, 'Item not found.');
    return success(res, item);
  } catch (err) { return serverError(res, err.message); }
});

// POST /items
router.post('/items', async (req, res) => {
  try {
    const {
      category_id, name, description, price = 0, currency = 'INR',
      image, is_veg = true, spiciness_level = 0, is_available = true,
      is_featured = false, sort_order = 0, tags,
    } = req.body;

    if (!name?.trim()) return badRequest(res, 'Item name is required.');

    const rid = req.restaurant.id;
    const tid = req.restaurant.tenant_id;

    // Auto-assign next item_number for this restaurant
    const [maxRow] = await query(
      'SELECT MAX(item_number) AS mx FROM menu_items WHERE restaurant_id = ?', [rid]
    );
    const nextNum = (maxRow[0]?.mx || 0) + 1;

    const [result] = await query(
      `INSERT INTO menu_items
       (item_number, restaurant_id, tenant_id, category_id, name, description, price, currency,
        image, is_veg, spiciness_level, is_available, is_featured, sort_order, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [nextNum, rid, tid, category_id || null, name.trim(), description || null,
       parseFloat(price) || 0, currency, image || null,
       is_veg ? 1 : 0, spiciness_level || 0,
       is_available ? 1 : 0, is_featured ? 1 : 0, sort_order || 0, tags || null]
    );
    const item = await queryOne('SELECT * FROM menu_items WHERE id = ?', [result.insertId]);
    return created(res, item, 'Menu item created.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// PUT /items/:id
router.put('/items/:id', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const existing = await queryOne(
      'SELECT id FROM menu_items WHERE id = ? AND restaurant_id = ?',
      [req.params.id, rid]
    );
    if (!existing) return notFound(res, 'Item not found.');

    const {
      category_id, name, description, price,
      image, is_veg, spiciness_level, is_available, is_featured, sort_order, tags,
    } = req.body;

    await query(
      `UPDATE menu_items SET
         category_id   = COALESCE(?, category_id),
         name          = COALESCE(?, name),
         description   = ?,
         price         = COALESCE(?, price),
         image         = ?,
         is_veg        = COALESCE(?, is_veg),
         spiciness_level = COALESCE(?, spiciness_level),
         is_available  = COALESCE(?, is_available),
         is_featured   = COALESCE(?, is_featured),
         sort_order    = COALESCE(?, sort_order),
         tags          = ?
       WHERE id = ? AND restaurant_id = ?`,
      [
        category_id || null, name || null, description !== undefined ? description : null,
        price !== undefined ? parseFloat(price) : null,
        image !== undefined ? image : null,
        is_veg !== undefined ? (is_veg ? 1 : 0) : null,
        spiciness_level !== undefined ? spiciness_level : null,
        is_available !== undefined ? (is_available ? 1 : 0) : null,
        is_featured !== undefined ? (is_featured ? 1 : 0) : null,
        sort_order !== undefined ? sort_order : null,
        tags !== undefined ? tags : null,
        req.params.id, rid,
      ]
    );
    const item = await queryOne('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    return success(res, item, 'Item updated.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// PATCH /items/:id/toggle  — flip is_available
router.patch('/items/:id/toggle', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const item = await queryOne('SELECT id, is_available FROM menu_items WHERE id = ? AND restaurant_id = ?', [req.params.id, rid]);
    if (!item) return notFound(res, 'Item not found.');
    const newVal = item.is_available ? 0 : 1;
    await query('UPDATE menu_items SET is_available = ? WHERE id = ?', [newVal, item.id]);
    return success(res, { is_available: Boolean(newVal) }, newVal ? 'Item marked available.' : 'Item marked unavailable.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// DELETE /items/:id
router.delete('/items/:id', async (req, res) => {
  try {
    const rid = req.restaurant.id;
    const existing = await queryOne('SELECT id FROM menu_items WHERE id = ? AND restaurant_id = ?', [req.params.id, rid]);
    if (!existing) return notFound(res, 'Item not found.');
    await query('DELETE FROM menu_items WHERE id = ? AND restaurant_id = ?', [req.params.id, rid]);
    return success(res, null, 'Item deleted.');
  } catch (err) {
    return serverError(res, err.message);
  }
});

// POST /items/upload-image
router.post('/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return badRequest(res, 'No file uploaded');
    }
    // Return a root-relative path — the frontend resolves it against the backend origin.
    // This avoids hardcoding the hostname and keeps URLs portable across environments.
    const fileUrl = req.file.publicUrl;
    return success(res, { url: fileUrl }, 'Image uploaded successfully');
  } catch (err) {
    return serverError(res, err.message);
  }
});

module.exports = router;
