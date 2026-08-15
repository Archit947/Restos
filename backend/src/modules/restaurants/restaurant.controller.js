'use strict';

const service = require('./restaurant.service');
const { success, created, paginated, badRequest, notFound, serverError, buildPaginationMeta } = require('../../utils/apiResponse');
const { isSubdomainAvailable, isReservedSubdomain } = require('../../utils/slugHelper');

async function list(req, res) {
  try {
    const { page, limit, search, status, plan_id, city, country, sort, order } = req.query;
    const result = await service.listRestaurants({ page, limit, search, status, plan_id, city, country, sort, order });
    const meta = buildPaginationMeta(result.page, result.limit, result.total);
    return paginated(res, result.restaurants, meta);
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function getById(req, res) {
  try {
    const restaurant = await service.getRestaurantById(req.params.id);
    if (!restaurant) return notFound(res, 'Restaurant not found.');
    return success(res, restaurant);
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function create(req, res) {
  try {
    const data = { ...req.body };

    // Handle file uploads
    if (req.files) {
      if (req.files.logo) data.logo = req.files.logo[0].filename;
      if (req.files.cover_image) data.cover_image = req.files.cover_image[0].filename;
    }

    const result = await service.createRestaurant(data, req.user, req);
    return created(res, result, 'Restaurant created successfully.');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    return serverError(res, err.message);
  }
}

async function update(req, res) {
  try {
    const data = { ...req.body };
    if (req.files) {
      if (req.files.logo) data.logo = req.files.logo[0].filename;
      if (req.files.cover_image) data.cover_image = req.files.cover_image[0].filename;
    }
    const restaurant = await service.updateRestaurant(req.params.id, data, req.user, req);
    return success(res, restaurant, 'Restaurant updated successfully.');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    return serverError(res, err.message);
  }
}

async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'inactive', 'trial', 'expired', 'suspended'];
    if (!status || !validStatuses.includes(status)) {
      return badRequest(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    await service.updateStatus(req.params.id, status, req.user, req);
    return success(res, null, `Restaurant status updated to ${status}.`);
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function remove(req, res) {
  try {
    await service.deleteRestaurant(req.params.id, req.user, req);
    return success(res, null, 'Restaurant deleted successfully.');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    return serverError(res, err.message);
  }
}

async function resetPassword(req, res) {
  try {
    const result = await service.resetRestaurantPassword(req.params.id, req.user, req);
    return success(res, result, 'Password reset successfully. Share the temporary password with the restaurant owner.');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    return serverError(res, err.message);
  }
}

async function changePlan(req, res) {
  try {
    const { plan_id } = req.body;
    if (!plan_id) return badRequest(res, 'plan_id is required.');
    const result = await service.changePlan(req.params.id, plan_id, req.user, req);
    return success(res, result, 'Plan changed successfully.');
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ success: false, message: err.message });
    return serverError(res, err.message);
  }
}

async function bulkAction(req, res) {
  try {
    const { ids, action } = req.body;
    if (!ids?.length || !action) return badRequest(res, 'ids and action are required.');
    const result = await service.bulkAction(ids, action, req.user, req);
    return success(res, result, `Bulk action "${action}" completed.`);
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function checkSubdomain(req, res) {
  try {
    const { subdomain } = req.query;
    if (!subdomain) return badRequest(res, 'subdomain is required.');

    const clean = subdomain.toLowerCase().trim();

    if (isReservedSubdomain(clean)) {
      return success(res, { available: false, reason: 'This subdomain is reserved.' });
    }

    if (!/^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/.test(clean) && clean.length > 2) {
      return success(res, { available: false, reason: 'Invalid subdomain format.' });
    }

    const env = require('../../config/env');
    const fullDomain = env.PLATFORM.SITE_BASE_URL
      ? `${env.PLATFORM.SITE_BASE_URL}/${clean}`
      : `${clean}${process.env.SUBDOMAIN_SUFFIX || '.restos.com'}`;

    const available = await isSubdomainAvailable(clean, req.query.exclude_id);
    return success(res, {
      available,
      subdomain: clean,
      full_domain: fullDomain,
      reason: available ? null : 'Subdomain is already taken.',
    });
  } catch (err) {
    return serverError(res, err.message);
  }
}

module.exports = { list, getById, create, update, updateStatus, remove, resetPassword, changePlan, bulkAction, checkSubdomain };
