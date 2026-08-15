'use strict';

const bcrypt = require('bcrypt');
const env = require('../config/env');

/**
 * Hash a plain-text password.
 */
async function hashPassword(plainText) {
  return bcrypt.hash(plainText, env.SECURITY.BCRYPT_ROUNDS);
}

/**
 * Compare plain-text against hashed password.
 */
async function verifyPassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}

/**
 * Generate a random temporary password.
 * Format: Abc@12345 (meets complexity requirements)
 */
function generateTempPassword(length = 10) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '@#$%!';
  const all = upper + lower + digits + special;

  let password = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  for (let i = password.length; i < length; i++) {
    password.push(all[Math.floor(Math.random() * all.length)]);
  }

  // Shuffle
  return password.sort(() => Math.random() - 0.5).join('');
}

/**
 * Validate password strength.
 * Returns { valid: boolean, message: string }
 */
function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character.' };
  }
  return { valid: true, message: 'Password is strong.' };
}

module.exports = { hashPassword, verifyPassword, generateTempPassword, validatePasswordStrength };
