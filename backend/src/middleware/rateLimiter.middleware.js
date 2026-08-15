'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

/**
 * General API rate limiter — skips public restaurant routes so customer-facing
 * pages (which fire 4-5 parallel requests on load) are never throttled.
 */
const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT.WINDOW_MS,
  max: env.RATE_LIMIT.MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  skip: (req) =>
    req.path === '/health' ||           // health check
    req.path.startsWith('/public/'),    // public restaurant pages
});

/**
 * Lenient limiter for public restaurant endpoints.
 * 300 req / 15 min per IP — covers heavy multi-request page loads.
 */
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

/**
 * Strict rate limiter for auth endpoints to prevent brute force.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

/**
 * Upload rate limiter.
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many upload requests. Please slow down.',
  },
});

module.exports = { generalLimiter, authLimiter, uploadLimiter, publicLimiter };
