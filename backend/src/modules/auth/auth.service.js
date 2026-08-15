'use strict';

const { query, queryOne } = require('../../config/database');
const { hashPassword, verifyPassword, generateTempPassword } = require('../../utils/passwordHelper');
const { generateAuthTokens, verifyRefreshToken, hashToken, generateSecureToken } = require('../../utils/tokenHelper');
const { createAuditLog, getClientIp } = require('../../middleware/auditLog.middleware');
const { AUDIT_ACTIONS } = require('../../config/constants');
const env = require('../../config/env');

/**
 * Authenticate super admin and return tokens.
 */
async function login(email, password, req) {
  const admin = await queryOne(
    'SELECT * FROM super_admins WHERE email = ? AND is_active = 1',
    [email.toLowerCase().trim()]
  );

  if (!admin) {
    await createAuditLog({
      action: AUDIT_ACTIONS.AUTH_FAILED,
      description: `Failed login attempt for email: ${email}`,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
      status: 'failure',
    });
    return { success: false, message: 'Invalid email or password.' };
  }

  const passwordValid = await verifyPassword(password, admin.password_hash);
  if (!passwordValid) {
    await createAuditLog({
      userId: admin.id,
      userEmail: admin.email,
      action: AUDIT_ACTIONS.AUTH_FAILED,
      description: 'Failed login attempt — wrong password.',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
      status: 'failure',
    });
    return { success: false, message: 'Invalid email or password.' };
  }

  const payload = { id: admin.id, email: admin.email, role: admin.role, type: 'super_admin' };
  const { accessToken, refreshToken, refreshTokenHash } = generateAuthTokens(payload);

  // Store refresh token
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await query(
    `INSERT INTO refresh_tokens (user_id, user_type, token_hash, expires_at, ip_address, user_agent)
     VALUES (?, 'super_admin', ?, ?, ?, ?)`,
    [admin.id, refreshTokenHash, expiresAt, getClientIp(req), req.headers['user-agent']]
  );

  // Update last login
  await query(
    'UPDATE super_admins SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
    [getClientIp(req), admin.id]
  );

  await createAuditLog({
    userId: admin.id,
    userEmail: admin.email,
    action: AUDIT_ACTIONS.AUTH_LOGIN,
    description: 'Super admin logged in.',
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
  });

  return {
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
      lastLoginAt: admin.last_login_at,
    },
  };
}

/**
 * Refresh access token using a valid refresh token.
 */
async function refreshToken(token, req) {
  const decoded = verifyRefreshToken(token);
  if (!decoded) return { success: false, message: 'Invalid or expired refresh token.' };

  const tokenHash = hashToken(token);
  const stored = await queryOne(
    'SELECT * FROM refresh_tokens WHERE token_hash = ? AND is_revoked = 0 AND expires_at > NOW()',
    [tokenHash]
  );

  if (!stored) return { success: false, message: 'Refresh token not found or expired.' };

  const admin = await queryOne('SELECT * FROM super_admins WHERE id = ? AND is_active = 1', [decoded.id]);
  if (!admin) return { success: false, message: 'User not found.' };

  // Revoke old token
  await query('UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = ?', [tokenHash]);

  // Issue new tokens
  const payload = { id: admin.id, email: admin.email, role: admin.role, type: 'super_admin' };
  const { accessToken, refreshToken: newRefreshToken, refreshTokenHash } = generateAuthTokens(payload);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await query(
    `INSERT INTO refresh_tokens (user_id, user_type, token_hash, expires_at, ip_address, user_agent)
     VALUES (?, 'super_admin', ?, ?, ?, ?)`,
    [admin.id, refreshTokenHash, expiresAt, getClientIp(req), req.headers['user-agent']]
  );

  return { success: true, accessToken, refreshToken: newRefreshToken };
}

/**
 * Logout — revoke refresh token.
 */
async function logout(userId, refreshTokenValue, req) {
  if (refreshTokenValue) {
    const tokenHash = hashToken(refreshTokenValue);
    await query('UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = ?', [tokenHash]);
  } else {
    // Revoke all sessions for this user
    await query('UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?', [userId]);
  }

  await createAuditLog({
    userId,
    action: AUDIT_ACTIONS.AUTH_LOGOUT,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
  });

  return { success: true };
}

/**
 * Initiate password reset — generate a secure token.
 */
async function forgotPassword(email) {
  const admin = await queryOne('SELECT * FROM super_admins WHERE email = ? AND is_active = 1', [email]);
  if (!admin) {
    // Return success even if not found (security: don't reveal existence)
    return { success: true, message: 'If that email exists, a reset link has been sent.' };
  }

  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const expires = new Date(Date.now() + env.SECURITY.PASSWORD_RESET_EXPIRES_HOURS * 60 * 60 * 1000);

  await query(
    'UPDATE super_admins SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
    [tokenHash, expires, admin.id]
  );

  // TODO: Send email with reset link
  // await emailHelper.sendPasswordReset(admin.email, token);

  return {
    success: true,
    message: 'Password reset link has been sent to your email.',
    // In dev mode, return token directly
    ...(env.IS_DEVELOPMENT && { resetToken: token }),
  };
}

/**
 * Reset password using a valid reset token.
 */
async function resetPassword(token, newPassword) {
  const tokenHash = hashToken(token);
  const admin = await queryOne(
    'SELECT * FROM super_admins WHERE password_reset_token = ? AND password_reset_expires > NOW()',
    [tokenHash]
  );

  if (!admin) return { success: false, message: 'Invalid or expired reset token.' };

  const passwordHash = await hashPassword(newPassword);
  await query(
    'UPDATE super_admins SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
    [passwordHash, admin.id]
  );

  // Revoke all refresh tokens
  await query('UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?', [admin.id]);

  await createAuditLog({
    userId: admin.id,
    userEmail: admin.email,
    action: AUDIT_ACTIONS.AUTH_PASSWORD_RESET,
    description: 'Password reset successfully.',
  });

  return { success: true, message: 'Password has been reset successfully.' };
}

/**
 * Get current admin profile.
 */
async function getProfile(adminId) {
  const admin = await queryOne(
    'SELECT id, name, email, role, avatar, is_active, last_login_at, created_at FROM super_admins WHERE id = ?',
    [adminId]
  );
  return admin;
}

/**
 * Update admin profile.
 */
async function updateProfile(adminId, { name, avatar }) {
  await query('UPDATE super_admins SET name = ?, avatar = ? WHERE id = ?', [name, avatar, adminId]);
  return getProfile(adminId);
}

/**
 * Change admin password.
 */
async function changePassword(adminId, currentPassword, newPassword) {
  const admin = await queryOne('SELECT * FROM super_admins WHERE id = ?', [adminId]);
  if (!admin) return { success: false, message: 'User not found.' };

  const valid = await verifyPassword(currentPassword, admin.password_hash);
  if (!valid) return { success: false, message: 'Current password is incorrect.' };

  const newHash = await hashPassword(newPassword);
  await query('UPDATE super_admins SET password_hash = ? WHERE id = ?', [newHash, adminId]);

  return { success: true, message: 'Password changed successfully.' };
}

module.exports = { login, refreshToken, logout, forgotPassword, resetPassword, getProfile, updateProfile, changePassword };
