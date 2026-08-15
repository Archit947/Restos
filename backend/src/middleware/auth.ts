import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { queryOne } from '../database/connection';
import { AppError } from '../utils/AppError';

export interface AuthPayload {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AuthPayload;
    }
  }
}

/**
 * Verify JWT access token from Authorization header
 */
export const authenticate = async (
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
    const payload = jwt.verify(token, config.jwt.secret) as AuthPayload;

    // Verify admin still exists and is active
    const admin = await queryOne(
      'SELECT id, email, role, is_active FROM super_admins WHERE id = ?',
      [payload.id]
    );

    if (!admin || !admin.is_active) {
      throw new AppError('Account not found or inactive', 401);
    }

    req.admin = { id: admin.id, email: admin.email, role: admin.role };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid or expired token', 401));
    } else {
      next(error);
    }
  }
};

/**
 * RBAC: require specific role(s)
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.admin) {
      return next(new AppError('Not authenticated', 401));
    }
    if (!roles.includes(req.admin.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
};
