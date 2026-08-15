'use strict';

/**
 * Standardized API response helpers.
 * All responses follow: { success, message, data, meta }
 */

const success = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return res.status(statusCode).json(response);
};

const created = (res, data = null, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

const paginated = (res, data, pagination, message = 'Success') => {
  return success(res, data, message, 200, pagination);
};

const error = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const response = { success: false, message };
  if (errors !== null) response.errors = errors;
  return res.status(statusCode).json(response);
};

const badRequest = (res, message = 'Bad request', errors = null) => {
  return error(res, message, 400, errors);
};

const unauthorized = (res, message = 'Unauthorized. Please log in.') => {
  return error(res, message, 401);
};

const forbidden = (res, message = 'Forbidden. You do not have permission.') => {
  return error(res, message, 403);
};

const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

const conflict = (res, message = 'Resource already exists') => {
  return error(res, message, 409);
};

const validationError = (res, errors) => {
  return error(res, 'Validation failed', 422, errors);
};

const serverError = (res, message = 'Internal server error') => {
  return error(res, message, 500);
};

/**
 * Build pagination meta from query params and total count.
 */
const buildPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

module.exports = {
  success,
  created,
  paginated,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  serverError,
  buildPaginationMeta,
};
