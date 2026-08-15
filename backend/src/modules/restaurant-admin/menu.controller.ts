import { Request, Response, NextFunction } from 'express';
import { query, execute } from '../../database/connection';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';

// ==========================================
// CATEGORIES
// ==========================================

export const getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.restaurantUser!;
    
    const categories = await query(
      'SELECT * FROM menu_categories WHERE restaurant_id = ? ORDER BY sort_order ASC, name ASC',
      [restaurantId]
    );
    
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId, tenantId } = req.restaurantUser!;
    const { name, description, sortOrder, isActive } = req.body;
    
    const id = uuidv4();
    await execute(
      `INSERT INTO menu_categories (id, tenant_id, restaurant_id, name, description, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, tenantId, restaurantId, name, description || null, sortOrder || 0, isActive !== undefined ? isActive : true]
    );
    
    const [newCategory] = await query('SELECT * FROM menu_categories WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.restaurantUser!;
    const { id } = req.params;
    const { name, description, sortOrder, isActive } = req.body;
    
    await execute(
      `UPDATE menu_categories 
       SET name = ?, description = ?, sort_order = ?, is_active = ?
       WHERE id = ? AND restaurant_id = ?`,
      [name, description || null, sortOrder || 0, isActive, id, restaurantId]
    );
    
    res.json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.restaurantUser!;
    const { id } = req.params;
    
    await execute('DELETE FROM menu_categories WHERE id = ? AND restaurant_id = ?', [id, restaurantId]);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ITEMS (PRODUCTS)
// ==========================================

export const getItems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.restaurantUser!;
    const { categoryId } = req.query;
    
    let sql = 'SELECT * FROM menu_items WHERE restaurant_id = ?';
    const params: any[] = [restaurantId];
    
    if (categoryId) {
      sql += ' AND category_id = ?';
      params.push(categoryId);
    }
    
    sql += ' ORDER BY sort_order ASC, name ASC';
    
    const items = await query(sql, params);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

export const createItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId, tenantId } = req.restaurantUser!;
    const { 
      categoryId, name, description, basePrice, currency, imageUrl, 
      isVeg, spicinessLevel, allergens, nutritionalInfo, isAvailable, sortOrder 
    } = req.body;
    
    const id = uuidv4();
    await execute(
      `INSERT INTO menu_items (
        id, tenant_id, restaurant_id, category_id, name, description, 
        base_price, currency, image_url, is_veg, spiciness_level, 
        allergens, nutritional_info, is_available, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, tenantId, restaurantId, categoryId, name, description || null,
        basePrice || 0, currency || 'INR', imageUrl || null, isVeg !== undefined ? isVeg : true,
        spicinessLevel || 0, allergens ? JSON.stringify(allergens) : null,
        nutritionalInfo ? JSON.stringify(nutritionalInfo) : null,
        isAvailable !== undefined ? isAvailable : true, sortOrder || 0
      ]
    );
    
    const [newItem] = await query('SELECT * FROM menu_items WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.restaurantUser!;
    const { id } = req.params;
    const { 
      categoryId, name, description, basePrice, imageUrl, 
      isVeg, spicinessLevel, allergens, nutritionalInfo, isAvailable, sortOrder 
    } = req.body;
    
    await execute(
      `UPDATE menu_items SET 
        category_id = ?, name = ?, description = ?, base_price = ?, image_url = ?, 
        is_veg = ?, spiciness_level = ?, allergens = ?, nutritional_info = ?, 
        is_available = ?, sort_order = ?
       WHERE id = ? AND restaurant_id = ?`,
      [
        categoryId, name, description || null, basePrice, imageUrl || null,
        isVeg, spicinessLevel, allergens ? JSON.stringify(allergens) : null,
        nutritionalInfo ? JSON.stringify(nutritionalInfo) : null,
        isAvailable, sortOrder, id, restaurantId
      ]
    );
    
    res.json({ success: true, message: 'Item updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.restaurantUser!;
    const { id } = req.params;
    
    await execute('DELETE FROM menu_items WHERE id = ? AND restaurant_id = ?', [id, restaurantId]);
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const uploadItemImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    const fileUrl = (req.file as any).publicUrl;

    res.json({ success: true, message: 'Image uploaded successfully', url: fileUrl });
  } catch (error) {
    next(error);
  }
};
