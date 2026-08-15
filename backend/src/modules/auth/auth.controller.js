'use strict';

const authService = require('./auth.service');
const { success, created, badRequest, serverError } = require('../../utils/apiResponse');
const { validatePasswordStrength } = require('../../utils/passwordHelper');

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return badRequest(res, 'Email and password are required.');

    const result = await authService.login(email, password, req);
    if (!result.success) return badRequest(res, result.message);

    return success(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    }, 'Login successful.');
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return badRequest(res, 'Refresh token is required.');

    const result = await authService.refreshToken(refreshToken, req);
    if (!result.success) return badRequest(res, result.message);

    return success(res, { accessToken: result.accessToken, refreshToken: result.refreshToken }, 'Token refreshed.');
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    await authService.logout(req.user.id, refreshToken, req);
    return success(res, null, 'Logged out successfully.');
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return badRequest(res, 'Email is required.');

    const result = await authService.forgotPassword(email.toLowerCase());
    return success(res, result.resetToken ? { resetToken: result.resetToken } : null, result.message);
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    if (!token || !password) return badRequest(res, 'Token and new password are required.');

    const strength = validatePasswordStrength(password);
    if (!strength.valid) return badRequest(res, strength.message);

    const result = await authService.resetPassword(token, password);
    if (!result.success) return badRequest(res, result.message);

    return success(res, null, result.message);
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function getProfile(req, res) {
  try {
    const profile = await authService.getProfile(req.user.id);
    return success(res, profile);
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function updateProfile(req, res) {
  try {
    const { name } = req.body;
    let avatar = undefined;
    if (req.file) avatar = req.file.filename;

    const updated = await authService.updateProfile(req.user.id, { name, avatar });
    return success(res, updated, 'Profile updated successfully.');
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return badRequest(res, 'Both current and new password are required.');

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) return badRequest(res, strength.message);

    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    if (!result.success) return badRequest(res, result.message);

    return success(res, null, result.message);
  } catch (err) {
    return serverError(res, err.message);
  }
}

module.exports = { login, refreshToken, logout, forgotPassword, resetPassword, getProfile, updateProfile, changePassword };
