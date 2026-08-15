import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { execute, query, queryOne } from '../../database/connection';
import { AppError } from '../../utils/AppError';

/**
 * List all templates
 */
export const getTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const templates = await query(`
      SELECT id, name, slug, description, thumbnail, preview_url, category, version, is_active, is_default, created_at, updated_at
      FROM templates
      ORDER BY is_default DESC, name ASC
    `);

    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set a template as default
 */
export const setTemplateDefault = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const template = await queryOne('SELECT id FROM templates WHERE id = ?', [id]);
    if (!template) {
      throw new AppError('Template not found', 404);
    }

    // Unset all defaults
    await execute('UPDATE templates SET is_default = 0');
    
    // Set the requested one as default
    await execute('UPDATE templates SET is_default = 1 WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Template set as default successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle template active status
 */
export const toggleTemplateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const template = await queryOne<{ is_active: boolean; is_default: boolean }>('SELECT is_active, is_default FROM templates WHERE id = ?', [id]);
    if (!template) {
      throw new AppError('Template not found', 404);
    }

    if (template.is_default && template.is_active) {
      throw new AppError('Cannot deactivate the default template', 400);
    }

    const newStatus = !template.is_active;

    await execute('UPDATE templates SET is_active = ? WHERE id = ?', [newStatus ? 1 : 0, id]);

    res.status(200).json({
      success: true,
      message: `Template ${newStatus ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a template
 */
export const deleteTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const template = await queryOne<{ is_default: boolean }>('SELECT is_default FROM templates WHERE id = ?', [id]);
    if (!template) {
      throw new AppError('Template not found', 404);
    }

    if (template.is_default) {
      throw new AppError('Cannot delete the default template', 400);
    }

    await execute('DELETE FROM templates WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
