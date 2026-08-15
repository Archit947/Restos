import { Request, Response, NextFunction } from 'express';
import { query, execute, db } from '../../database/connection';
import { v4 as uuidv4 } from 'uuid';

// ==========================================
// SUPPLIERS
// ==========================================

export const getSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.restaurantUser!;
    
    const suppliers = await query(
      'SELECT * FROM inventory_suppliers WHERE restaurant_id = ? ORDER BY name ASC',
      [restaurantId]
    );
    
    res.json({ success: true, data: suppliers });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId, tenantId } = req.restaurantUser!;
    const { name, contactPerson, email, phone, address, isActive } = req.body;
    
    const id = uuidv4();
    await execute(
      `INSERT INTO inventory_suppliers (id, tenant_id, restaurant_id, name, contact_person, email, phone, address, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tenantId, restaurantId, name, contactPerson || null, email || null, phone || null, address || null, isActive !== undefined ? isActive : true]
    );
    
    const [newSupplier] = await query('SELECT * FROM inventory_suppliers WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: newSupplier });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.restaurantUser!;
    const { id } = req.params;
    const { name, contactPerson, email, phone, address, isActive } = req.body;
    
    await execute(
      `UPDATE inventory_suppliers 
       SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?, is_active = ?
       WHERE id = ? AND restaurant_id = ?`,
      [name, contactPerson || null, email || null, phone || null, address || null, isActive, id, restaurantId]
    );
    
    res.json({ success: true, message: 'Supplier updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.restaurantUser!;
    const { id } = req.params;
    
    await execute('DELETE FROM inventory_suppliers WHERE id = ? AND restaurant_id = ?', [id, restaurantId]);
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// INGREDIENTS
// ==========================================

export const getIngredients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.restaurantUser!;
    
    const ingredients = await query(
      `SELECT i.*, s.name as supplier_name 
       FROM inventory_ingredients i
       LEFT JOIN inventory_suppliers s ON i.supplier_id = s.id
       WHERE i.restaurant_id = ?
       ORDER BY i.name ASC`,
      [restaurantId]
    );
    
    res.json({ success: true, data: ingredients });
  } catch (error) {
    next(error);
  }
};

export const createIngredient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId, tenantId } = req.restaurantUser!;
    const { supplierId, name, sku, unitOfMeasure, costPerUnit, currentStock, lowStockThreshold, isActive } = req.body;
    
    const id = uuidv4();
    await execute(
      `INSERT INTO inventory_ingredients (
        id, tenant_id, restaurant_id, supplier_id, name, sku, 
        unit_of_measure, cost_per_unit, current_stock, low_stock_threshold, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, tenantId, restaurantId, supplierId || null, name, sku || null,
        unitOfMeasure, costPerUnit || 0, currentStock || 0, lowStockThreshold || 0,
        isActive !== undefined ? isActive : true
      ]
    );
    
    const [newIngredient] = await query('SELECT * FROM inventory_ingredients WHERE id = ?', [id]);
    res.status(201).json({ success: true, data: newIngredient });
  } catch (error) {
    next(error);
  }
};

export const updateIngredient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.restaurantUser!;
    const { id } = req.params;
    const { supplierId, name, sku, unitOfMeasure, costPerUnit, lowStockThreshold, isActive } = req.body;
    
    await execute(
      `UPDATE inventory_ingredients 
       SET supplier_id = ?, name = ?, sku = ?, unit_of_measure = ?, 
           cost_per_unit = ?, low_stock_threshold = ?, is_active = ?
       WHERE id = ? AND restaurant_id = ?`,
      [
        supplierId || null, name, sku || null, unitOfMeasure,
        costPerUnit, lowStockThreshold, isActive, id, restaurantId
      ]
    );
    
    res.json({ success: true, message: 'Ingredient updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteIngredient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { restaurantId } = req.restaurantUser!;
    const { id } = req.params;
    
    await execute('DELETE FROM inventory_ingredients WHERE id = ? AND restaurant_id = ?', [id, restaurantId]);
    res.json({ success: true, message: 'Ingredient deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// STOCK ADJUSTMENT (TRANSACTIONS)
// ==========================================

export const adjustStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const conn = await db.getConnection();
  try {
    const { restaurantId, tenantId } = req.restaurantUser!;
    const { ingredientId, type, quantity, notes } = req.body; // type: 'add', 'remove'
    
    await conn.beginTransaction();

    // 1. Get current ingredient stock
    const [rows] = await conn.execute(
      'SELECT current_stock, cost_per_unit FROM inventory_ingredients WHERE id = ? AND restaurant_id = ? FOR UPDATE',
      [ingredientId, restaurantId]
    ) as any;
    
    if (rows.length === 0) {
      throw new Error('Ingredient not found');
    }
    
    const currentStock = parseFloat(rows[0].current_stock);
    const unitCost = parseFloat(rows[0].cost_per_unit);
    const adjustQty = parseFloat(quantity);
    
    if (isNaN(adjustQty) || adjustQty <= 0) {
      throw new Error('Invalid quantity');
    }

    const newStock = type === 'add' ? currentStock + adjustQty : currentStock - adjustQty;
    
    if (newStock < 0) {
      throw new Error('Cannot reduce stock below 0');
    }

    // 2. Update stock
    await conn.execute(
      'UPDATE inventory_ingredients SET current_stock = ? WHERE id = ?',
      [newStock, ingredientId]
    );

    // 3. Create transaction record
    const transId = uuidv4();
    const transactionType = type === 'add' ? 'in' : 'out';
    const totalCost = unitCost * adjustQty;
    
    await conn.execute(
      `INSERT INTO inventory_transactions (
        id, tenant_id, restaurant_id, ingredient_id, transaction_type, 
        quantity, unit_cost, total_cost, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transId, tenantId, restaurantId, ingredientId, transactionType,
        adjustQty, unitCost, totalCost, notes || null
      ]
    );

    await conn.commit();
    res.json({ success: true, message: 'Stock adjusted successfully', newStock });
  } catch (error) {
    await conn.rollback();
    next(error);
  } finally {
    conn.release();
  }
};
