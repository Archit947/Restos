import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { queryOne } from '../database/connection';
import { AppError } from '../utils/AppError';

export interface RestaurantAuthPayload {
  id: string;
  restaurantId: string;
  tenantId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      restaurantUser?: RestaurantAuthPayload;
    }
  }
}

/**
 * Verify JWT access token for restaurant admins
 */
export const requireRestaurantAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, config.jwt.secret) as RestaurantAuthPayload;

    if (payload.role !== 'restaurant_admin') {
      throw new AppError('Unauthorized access', 403);
    }

    // Verify credential still exists
    const creds = await queryOne<{ id: string; tenant_id: string; restaurant_id: string }>(
      'SELECT id, tenant_id, restaurant_id FROM restaurant_credentials WHERE id = ?',
      [payload.id]
    );

    if (!creds || creds.tenant_id !== payload.tenantId) {
      throw new AppError('Invalid credentials', 401);
    }

    req.restaurantUser = {
      id: creds.id,
      restaurantId: creds.restaurant_id,
      tenantId: creds.tenant_id,
      role: 'restaurant_admin',
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid or expired token', 401));
    } else {
      next(error);
    }
  }
};
