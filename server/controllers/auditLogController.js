const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');
const { formatPaginationResponse } = require('../utils/helpers');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, entity, action, userId, dateFrom, dateTo } = req.query;
    const where = {};

    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (dateFrom && dateTo) {
      where.createdAt = { [Op.between]: [dateFrom, dateTo] };
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email', 'role'] }],
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, ...formatPaginationResponse(rows, count, page, limit) });
  } catch (error) {
    next(error);
  }
};
