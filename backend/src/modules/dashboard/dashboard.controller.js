'use strict';

const service = require('./dashboard.service');
const { success, serverError } = require('../../utils/apiResponse');

async function getStats(req, res) {
  try {
    const stats = await service.getDashboardStats();
    return success(res, stats);
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function getCharts(req, res) {
  try {
    const [growth, monthly, distribution] = await Promise.all([
      service.getRestaurantGrowthData(),
      service.getMonthlyNewRestaurants(),
      service.getStatusDistribution(),
    ]);
    return success(res, { growth, monthly, distribution });
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function getRecentActivity(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const activities = await service.getRecentActivity(limit);
    return success(res, activities);
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function getExpiringSubscriptions(req, res) {
  try {
    const data = await service.getExpiringSubscriptions();
    return success(res, data);
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function getTopRestaurants(req, res) {
  try {
    const data = await service.getTopRestaurants();
    return success(res, data);
  } catch (err) {
    return serverError(res, err.message);
  }
}

module.exports = { getStats, getCharts, getRecentActivity, getExpiringSubscriptions, getTopRestaurants };
