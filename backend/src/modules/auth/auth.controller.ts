import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { config } from '../../config';
import { query, queryOne, execute } from '../../database/connection';
import { AppError } from '../../utils/AppError';

/**
 * Generate JWT access + refresh token pair
 */
function generateTokens(adminId: string, email: string, role: string) {
  const accessToken = jwt.sign(
    { id: adminId, email, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any }
  );
  const refreshToken = jwt.sign(
    { id: adminId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn as any }
  );
  return { accessToken, refreshToken };
}

/**
 * POST /api/v1/auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const admin = await queryOne(
      'SELECT id, name, email, password_hash, role, is_active, avatar FROM super_admins WHERE email = ?',
      [email]
    );

    if (!admin) throw new AppError('Invalid email or password', 401);
    if (!admin.is_active) throw new AppError('Account is deactivated', 401);

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) throw new AppError('Invalid email or password', 401);

    const { accessToken, refreshToken } = generateTokens(admin.id, admin.email, admin.role);

    // Hash refresh token before storing
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await execute(
      `INSERT INTO refresh_tokens (id, admin_id, token_hash, expires_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), admin.id, refreshTokenHash, expiresAt, req.ip, req.headers['user-agent'] || '']
    );

    // Update last login
    await execute('UPDATE super_admins SET last_login_at = NOW() WHERE id = ?', [admin.id]);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          avatar: admin.avatar,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/refresh
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw new AppError('Refresh token required', 400);

    const payload = jwt.verify(token, config.jwt.refreshSecret) as { id: string };
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const stored = await queryOne(
      'SELECT id, admin_id, revoked, expires_at FROM refresh_tokens WHERE token_hash = ?',
      [tokenHash]
    );

    if (!stored || stored.revoked || new Date(stored.expires_at) < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const admin = await queryOne(
      'SELECT id, email, role FROM super_admins WHERE id = ? AND is_active = 1',
      [payload.id]
    );
    if (!admin) throw new AppError('Admin not found', 401);

    // Revoke old token and issue new pair
    await execute('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?', [stored.id]);

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(admin.id, admin.email, admin.role);
    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await execute(
      `INSERT INTO refresh_tokens (id, admin_id, token_hash, expires_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), admin.id, newHash, expiresAt, req.ip, req.headers['user-agent'] || '']
    );

    res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await execute('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?', [tokenHash]);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/me
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const admin = await queryOne(
      'SELECT id, name, email, role, avatar, last_login_at, created_at FROM super_admins WHERE id = ?',
      [req.admin!.id]
    );
    res.json({ success: true, data: admin });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/auth/change-password
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await queryOne(
      'SELECT id, password_hash FROM super_admins WHERE id = ?',
      [req.admin!.id]
    );
    if (!admin) throw new AppError('Admin not found', 404);

    const isValid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isValid) throw new AppError('Current password is incorrect', 400);

    const newHash = await bcrypt.hash(newPassword, 12);
    await execute('UPDATE super_admins SET password_hash = ? WHERE id = ?', [newHash, admin.id]);

    // Revoke all refresh tokens
    await execute('UPDATE refresh_tokens SET revoked = 1 WHERE admin_id = ?', [admin.id]);

    res.json({ success: true, message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    next(error);
  }
};
