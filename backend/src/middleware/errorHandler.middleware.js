'use strict';

const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * Global Express error handler.
 * Must be registered LAST in the middleware stack.
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log the error
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} → ${statusCode}`, {
      message: err.message,
      stack: err.stack,
      user: req.user?.id,
      ip: req.ip,
    });
  } else {
    logger.warn(`[${req.method}] ${req.path} → ${statusCode}: ${message}`);
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: `File size exceeds the maximum allowed limit.`,
    });
  }

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists.',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token has expired.' });
  }

  const response = {
    success: false,
    message,
  };

  // Include stack trace only in development
  if (env.IS_DEVELOPMENT && err.stack) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
}

/**
 * Handle 404 — route not found.
 */
function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: `Route not found: [${req.method}] ${req.originalUrl}`,
  });
}

module.exports = { errorHandler, notFoundHandler };
