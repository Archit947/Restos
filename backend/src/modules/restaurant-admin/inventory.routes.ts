import { Router } from 'express';
import { 
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getIngredients, createIngredient, updateIngredient, deleteIngredient,
  adjustStock
} from './inventory.controller';

const router = Router();

// Suppliers
router.get('/suppliers', getSuppliers);
router.post('/suppliers', createSupplier);
router.put('/suppliers/:id', updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);

// Ingredients (Raw Materials)
router.get('/ingredients', getIngredients);
router.post('/ingredients', createIngredient);
router.put('/ingredients/:id', updateIngredient);
router.delete('/ingredients/:id', deleteIngredient);

// Stock Adjustments
router.post('/adjust', adjustStock);

export { router as inventoryRoutes };
