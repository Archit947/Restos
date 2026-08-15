import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, execute } from '../../database/connection';
import { AppError } from '../../utils/AppError';
import { config } from '../../config';

export const restaurantLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError('Username and password are required', 400);
    }

    const creds = await queryOne<{
      id: string;
      restaurant_id: string;
      tenant_id: string;
      password_hash: string;
      is_temp_password: boolean;
      setup_completed: boolean;
    }>(
      'SELECT id, restaurant_id, tenant_id, password_hash, is_temp_password, setup_completed FROM restaurant_credentials WHERE username = ?',
      [username]
    );

    if (!creds) {
      throw new AppError('Invalid credentials', 401);
    }

    const validPassword = await bcrypt.compare(password, creds.password_hash);
    if (!validPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify restaurant is active
    const restaurant = await queryOne<{ status: string; restaurant_name: string }>(
      'SELECT status, restaurant_name FROM restaurants WHERE id = ?',
      [creds.restaurant_id]
    );

    if (!restaurant || restaurant.status === 'suspended' || restaurant.status === 'expired') {
      throw new AppError('Account is inactive or suspended', 403);
    }

    // Generate token
    const tokenPayload = {
      id: creds.id,
      restaurantId: creds.restaurant_id,
      tenantId: creds.tenant_id,
      role: 'restaurant_admin',
    };

    const accessToken = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    // Update last login
    await execute('UPDATE restaurant_credentials SET last_login_at = NOW() WHERE id = ?', [creds.id]);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        user: {
          id: creds.id,
          restaurantId: creds.restaurant_id,
          tenantId: creds.tenant_id,
          username,
          restaurantName: restaurant.restaurant_name,
          isTempPassword: Boolean(creds.is_temp_password),
          setupCompleted: Boolean(creds.setup_completed),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
