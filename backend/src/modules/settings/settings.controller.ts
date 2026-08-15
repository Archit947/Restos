import { Request, Response, NextFunction } from 'express';
import { queryOne, execute } from '../../database/connection';
import { AppError } from '../../utils/AppError';

/**
 * GET /api/v1/settings
 */
export const getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await queryOne('SELECT * FROM platform_settings WHERE id = 1');
    if (!settings) throw new AppError('Settings not found', 404);
    // Remove sensitive SMTP password from response
    delete settings.smtp_pass;
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/settings
 */
export const updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      platform_name, timezone, currency, currency_symbol, date_format,
      language, maintenance_mode, smtp_host, smtp_port, smtp_user,
      smtp_pass, smtp_from, smtp_secure,
    } = req.body;

    await execute(
      `UPDATE platform_settings SET
       platform_name = COALESCE(?, platform_name),
       timezone = COALESCE(?, timezone),
       currency = COALESCE(?, currency),
       currency_symbol = COALESCE(?, currency_symbol),
       date_format = COALESCE(?, date_format),
       language = COALESCE(?, language),
       maintenance_mode = COALESCE(?, maintenance_mode),
       smtp_host = COALESCE(?, smtp_host),
       smtp_port = COALESCE(?, smtp_port),
       smtp_user = COALESCE(?, smtp_user),
       smtp_pass = COALESCE(?, smtp_pass),
       smtp_from = COALESCE(?, smtp_from),
       smtp_secure = COALESCE(?, smtp_secure)
       WHERE id = 1`,
      [
        platform_name, timezone, currency, currency_symbol, date_format,
        language, maintenance_mode, smtp_host, smtp_port, smtp_user,
        smtp_pass, smtp_from, smtp_secure,
      ]
    );

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
};
