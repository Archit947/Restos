'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

/**
 * Sign a JWT access token.
 */
function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT.ACCESS_SECRET, {
    expiresIn: env.JWT.ACCESS_EXPIRY,
    issuer: 'restos-platform',
  });
}

/**
 * Sign a JWT refresh token.
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT.REFRESH_SECRET, {
    expiresIn: env.JWT.REFRESH_EXPIRY,
    issuer: 'restos-platform',
  });
}

/**
 * Verify an access token.
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT.ACCESS_SECRET, { issuer: 'restos-platform' });
  } catch (err) {
    return null;
  }
}

/**
 * Verify a refresh token.
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.JWT.REFRESH_SECRET, { issuer: 'restos-platform' });
  } catch (err) {
    return null;
  }
}

/**
 * Generate a secure random token for password reset, email verification, etc.
 */
function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash a token for database storage (never store raw tokens).
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate both access and refresh tokens for a user.
 */
function generateAuthTokens(payload) {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const refreshTokenHash = hashToken(refreshToken);
  return { accessToken, refreshToken, refreshTokenHash };
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateSecureToken,
  hashToken,
  generateAuthTokens,
};
