const analyticsService = require('../services/analyticsService');

exports.getOverview = async (req, res, next) => {
  try {
    const stats = await analyticsService.getOverviewStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

exports.getPatientTrends = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months, 10) || 12;
    const data = await analyticsService.getPatientTrends(months);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getRevenue = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months, 10) || 12;
    const data = await analyticsService.getRevenueByMonth(months);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getDoctorWorkload = async (req, res, next) => {
  try {
    const data = await analyticsService.getDoctorWorkload();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getAppointmentsByStatus = async (req, res, next) => {
  try {
    const data = await analyticsService.getAppointmentsByStatus();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getDepartmentDistribution = async (req, res, next) => {
  try {
    const data = await analyticsService.getDepartmentDistribution();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getRecentActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const data = await analyticsService.getRecentActivity(limit);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
